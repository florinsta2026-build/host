import { describe, it, expect } from "vitest";
import { STATUS_TO_FULFILLMENT } from "@/lib/orders/admin-actions";

describe("order status -> fulfillment status mapping", () => {
  it("maps PREPARING to fulfillment PREPARING", () => {
    expect(STATUS_TO_FULFILLMENT.PREPARING).toBe("PREPARING");
  });

  it("maps DELIVERED to fulfillment DELIVERED", () => {
    expect(STATUS_TO_FULFILLMENT.DELIVERED).toBe("DELIVERED");
  });

  it("maps OUT_FOR_DELIVERY to fulfillment OUT_FOR_DELIVERY", () => {
    expect(STATUS_TO_FULFILLMENT.OUT_FOR_DELIVERY).toBe("OUT_FOR_DELIVERY");
  });

  it("does not define a fulfillment change for PENDING/CONFIRMED/CANCELLED/REFUNDED", () => {
    expect(STATUS_TO_FULFILLMENT.PENDING).toBeUndefined();
    expect(STATUS_TO_FULFILLMENT.CONFIRMED).toBeUndefined();
    expect(STATUS_TO_FULFILLMENT.CANCELLED).toBeUndefined();
    expect(STATUS_TO_FULFILLMENT.REFUNDED).toBeUndefined();
  });
});
