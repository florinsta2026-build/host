import { describe, it, expect } from "vitest";
import { checkoutSchema } from "@/lib/validation/checkout";

const validPayload = {
  customer: { firstName: "Amira", lastName: "Khan", email: "amira@example.com", phone: "+971501234567" },
  address: {
    recipientName: "Amira Khan",
    phone: "+971501234567",
    addressLine1: "Villa 12, Street 4",
    area: "Jumeirah",
    city: "Dubai",
    emirate: "Dubai",
  },
  items: [{ productId: "prod_1", quantity: 2, selectedOptionValueIds: {} }],
  deliveryDate: new Date(Date.now() + 86400000).toISOString(),
  deliverySlotId: "slot_1",
};

describe("checkoutSchema", () => {
  it("accepts a valid payload", () => {
    const result = checkoutSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects an empty cart", () => {
    const result = checkoutSchema.safeParse({ ...validPayload, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = checkoutSchema.safeParse({
      ...validPayload,
      customer: { ...validPayload.customer, email: "not-an-email" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a quantity of zero or negative", () => {
    const result = checkoutSchema.safeParse({
      ...validPayload,
      items: [{ productId: "prod_1", quantity: 0, selectedOptionValueIds: {} }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unreasonably large quantity (basic abuse guard)", () => {
    const result = checkoutSchema.safeParse({
      ...validPayload,
      items: [{ productId: "prod_1", quantity: 999, selectedOptionValueIds: {} }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing delivery slot", () => {
    const result = checkoutSchema.safeParse({ ...validPayload, deliverySlotId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid delivery date string", () => {
    const result = checkoutSchema.safeParse({ ...validPayload, deliveryDate: "not-a-date" });
    expect(result.success).toBe(false);
  });
});
