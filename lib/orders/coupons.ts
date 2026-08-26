import type { Prisma } from "@prisma/client";

export type CouponValidationResult =
  | { ok: true; couponId: string; discountMinor: number }
  | { ok: false; reason: string };

export async function validateAndPriceCoupon(
  tx: Prisma.TransactionClient,
  code: string,
  subtotalMinor: number,
  customerId: string
): Promise<CouponValidationResult> {
  const coupon = await tx.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.isActive) return { ok: false, reason: "This coupon code is not valid." };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, reason: "This coupon is not active yet." };
  if (coupon.expiresAt && now > coupon.expiresAt) return { ok: false, reason: "This coupon has expired." };

  if (coupon.minimumOrderMinor && subtotalMinor < coupon.minimumOrderMinor) {
    return { ok: false, reason: "Your order does not meet the minimum amount for this coupon." };
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, reason: "This coupon has reached its usage limit." };
  }

  if (coupon.perCustomerLimit) {
    const customerUsage = await tx.couponUsage.count({
      where: { couponId: coupon.id, customerId },
    });
    if (customerUsage >= coupon.perCustomerLimit) {
      return { ok: false, reason: "You have already used this coupon." };
    }
  }

  let discountMinor =
    coupon.type === "PERCENTAGE"
      ? Math.round((subtotalMinor * coupon.value) / 100)
      : coupon.value;

  if (coupon.maximumDiscountMinor) {
    discountMinor = Math.min(discountMinor, coupon.maximumDiscountMinor);
  }

  // Never allow a discount to exceed the subtotal it applies to.
  discountMinor = Math.min(discountMinor, subtotalMinor);
  discountMinor = Math.max(discountMinor, 0);

  return { ok: true, couponId: coupon.id, discountMinor };
}
