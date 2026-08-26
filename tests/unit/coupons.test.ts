import { describe, it, expect, vi } from "vitest";
import { validateAndPriceCoupon } from "@/lib/orders/coupons";
import type { Prisma } from "@prisma/client";

function makeMockTx(coupon: Record<string, unknown> | null, customerUsageCount = 0) {
  return {
    coupon: {
      findUnique: vi.fn().mockResolvedValue(coupon),
    },
    couponUsage: {
      count: vi.fn().mockResolvedValue(customerUsageCount),
    },
  } as unknown as Prisma.TransactionClient;
}

const baseCoupon = {
  id: "coupon_1",
  code: "WELCOME10",
  type: "PERCENTAGE",
  value: 10,
  minimumOrderMinor: null,
  maximumDiscountMinor: null,
  startsAt: null,
  expiresAt: null,
  usageLimit: null,
  usageCount: 0,
  perCustomerLimit: 1,
  isActive: true,
};

describe("validateAndPriceCoupon", () => {
  it("rejects unknown coupon codes", async () => {
    const tx = makeMockTx(null);
    const result = await validateAndPriceCoupon(tx, "NOPE", 10000, "cust_1");
    expect(result.ok).toBe(false);
  });

  it("rejects inactive coupons", async () => {
    const tx = makeMockTx({ ...baseCoupon, isActive: false });
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result.ok).toBe(false);
  });

  it("calculates a percentage discount correctly", async () => {
    const tx = makeMockTx(baseCoupon);
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result).toEqual({ ok: true, couponId: "coupon_1", discountMinor: 1000 });
  });

  it("calculates a fixed discount correctly", async () => {
    const tx = makeMockTx({ ...baseCoupon, type: "FIXED", value: 5000 });
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result).toEqual({ ok: true, couponId: "coupon_1", discountMinor: 5000 });
  });

  it("caps discount at the order subtotal (never a negative total)", async () => {
    const tx = makeMockTx({ ...baseCoupon, type: "FIXED", value: 50000 });
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result).toEqual({ ok: true, couponId: "coupon_1", discountMinor: 10000 });
  });

  it("applies the maximum discount cap on percentage coupons", async () => {
    const tx = makeMockTx({ ...baseCoupon, type: "PERCENTAGE", value: 50, maximumDiscountMinor: 2000 });
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result).toEqual({ ok: true, couponId: "coupon_1", discountMinor: 2000 });
  });

  it("rejects orders below the minimum order value", async () => {
    const tx = makeMockTx({ ...baseCoupon, minimumOrderMinor: 20000 });
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result.ok).toBe(false);
  });

  it("rejects expired coupons", async () => {
    const tx = makeMockTx({ ...baseCoupon, expiresAt: new Date("2020-01-01") });
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result.ok).toBe(false);
  });

  it("rejects coupons that haven't started yet", async () => {
    const tx = makeMockTx({ ...baseCoupon, startsAt: new Date("2099-01-01") });
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result.ok).toBe(false);
  });

  it("rejects coupons at their global usage limit", async () => {
    const tx = makeMockTx({ ...baseCoupon, usageLimit: 5, usageCount: 5 });
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result.ok).toBe(false);
  });

  it("rejects a customer who already used their per-customer allowance", async () => {
    const tx = makeMockTx({ ...baseCoupon, perCustomerLimit: 1 }, 1);
    const result = await validateAndPriceCoupon(tx, "WELCOME10", 10000, "cust_1");
    expect(result.ok).toBe(false);
  });

  it("is case-insensitive and trims whitespace on the code", async () => {
    const tx = makeMockTx(baseCoupon);
    await validateAndPriceCoupon(tx, "  welcome10  ", 10000, "cust_1");
    expect(tx.coupon.findUnique).toHaveBeenCalledWith({ where: { code: "WELCOME10" } });
  });
});
