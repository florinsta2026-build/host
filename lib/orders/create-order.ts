import { prisma } from "@/lib/db/prisma";
import { nextOrderNumber } from "./order-number";
import { validateAndPriceCoupon } from "./coupons";
import type { CheckoutInput } from "@/lib/validation/checkout";

export class CheckoutError extends Error {
  constructor(message: string, public readonly code: string = "CHECKOUT_ERROR") {
    super(message);
  }
}

async function getTaxRatePercent(): Promise<number> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "tax_rate_percent" } });
  const value = setting?.value;
  return typeof value === "number" ? value : 0;
}

export async function createPendingOrder(input: CheckoutInput) {
  return prisma.$transaction(async (tx) => {
    // ── 1. Re-price every line item from the database. Never trust client-sent prices. ──
    let subtotalMinor = 0;
    const orderItemsData: {
      productId: string;
      productNameSnapshot: string;
      skuSnapshot: string;
      unitPriceMinor: number;
      quantity: number;
      totalMinor: number;
      selectedOptions: { group: string; value: string; priceDeltaMinor: number }[];
    }[] = [];

    const reservations: { productId: string; quantity: number }[] = [];

    for (const item of input.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { options: { include: { values: true } }, inventory: true },
      });

      if (!product || product.status !== "PUBLISHED" || !product.isAvailable) {
        throw new CheckoutError(`"${product?.name ?? "An item"}" in your cart is no longer available.`, "PRODUCT_UNAVAILABLE");
      }

      // A zero price marks a quote-only item (event installations, arches, balloon styling).
      // The storefront offers an enquiry link instead of add-to-cart, but that is only the UI —
      // refuse it here too, or a crafted request could order event work for nothing.
      if (product.priceMinor <= 0) {
        throw new CheckoutError(
          `"${product.name}" is priced on enquiry and cannot be bought online. Please contact us for a quote.`,
          "PRODUCT_QUOTE_ONLY",
        );
      }

      let unitPriceMinor = product.priceMinor;
      const selectedOptions: { group: string; value: string; priceDeltaMinor: number }[] = [];

      for (const group of product.options) {
        const chosenValueId = item.selectedOptionValueIds[group.id];
        if (group.required && !chosenValueId) {
          throw new CheckoutError(`Please choose a "${group.name}" option for ${product.name}.`, "OPTION_REQUIRED");
        }
        if (chosenValueId) {
          const value = group.values.find((v) => v.id === chosenValueId);
          if (!value) {
            throw new CheckoutError(`Invalid option selected for ${product.name}.`, "OPTION_INVALID");
          }
          unitPriceMinor += value.priceDeltaMinor;
          selectedOptions.push({ group: group.name, value: value.label, priceDeltaMinor: value.priceDeltaMinor });
        }
      }

      if (product.stockTrackingEnabled && product.inventory) {
        const available = product.inventory.quantity - product.inventory.reservedQuantity;
        if (available < item.quantity) {
          throw new CheckoutError(
            `Only ${Math.max(available, 0)} of "${product.name}" left in stock.`,
            "INSUFFICIENT_STOCK"
          );
        }
        reservations.push({ productId: product.id, quantity: item.quantity });
      }

      const lineTotal = unitPriceMinor * item.quantity;
      subtotalMinor += lineTotal;

      orderItemsData.push({
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceMinor,
        quantity: item.quantity,
        totalMinor: lineTotal,
        selectedOptions,
      });
    }

    // ── 2. Delivery zone + slot (server-validated, never trust a client-sent fee) ──
    const slot = await tx.deliverySlot.findUnique({ where: { id: input.deliverySlotId } });
    if (!slot || !slot.isActive) {
      throw new CheckoutError("The selected delivery time slot is no longer available.", "SLOT_UNAVAILABLE");
    }

    const slotOrderCount = await tx.order.count({
      where: {
        deliveryTimeSlotId: slot.id,
        deliveryDate: new Date(input.deliveryDate),
        status: { notIn: ["CANCELLED"] },
      },
    });
    if (slotOrderCount >= slot.maxOrders) {
      throw new CheckoutError("This delivery slot is fully booked for the selected date.", "SLOT_FULL");
    }

    const freeDeliverySetting = await tx.siteSetting.findUnique({ where: { key: "free_delivery_threshold_minor" } });
    const freeDeliveryThreshold = typeof freeDeliverySetting?.value === "number" ? freeDeliverySetting.value : Infinity;

    const zone = await tx.deliveryZone.findFirst({ where: { isActive: true } });
    const deliveryFeeMinor = zone ? (subtotalMinor >= freeDeliveryThreshold ? 0 : zone.feeMinor) : 0;

    // ── 3. Customer + address (upsert by email — do not duplicate customer records) ──
    const customer = await tx.customer.upsert({
      where: { email: input.customer.email.toLowerCase() },
      update: { firstName: input.customer.firstName, lastName: input.customer.lastName, phone: input.customer.phone },
      create: {
        email: input.customer.email.toLowerCase(),
        firstName: input.customer.firstName,
        lastName: input.customer.lastName,
        phone: input.customer.phone,
      },
    });

    // ── 4. Coupon (server-validated & re-priced) ──
    let discountMinor = 0;
    let couponId: string | undefined;
    if (input.couponCode) {
      const result = await validateAndPriceCoupon(tx, input.couponCode, subtotalMinor, customer.id);
      if (!result.ok) throw new CheckoutError(result.reason, "COUPON_INVALID");
      discountMinor = result.discountMinor;
      couponId = result.couponId;
    }

    const taxRatePercent = await getTaxRatePercent();
    const taxMinor = Math.round(((subtotalMinor - discountMinor) * taxRatePercent) / 100);
    const totalMinor = subtotalMinor - discountMinor + deliveryFeeMinor + taxMinor;

    const address = await tx.customerAddress.create({
      data: {
        customerId: customer.id,
        label: input.address.label,
        recipientName: input.address.recipientName,
        phone: input.address.phone,
        addressLine1: input.address.addressLine1,
        addressLine2: input.address.addressLine2,
        area: input.address.area,
        city: input.address.city,
        emirate: input.address.emirate,
        deliveryInstructions: input.address.deliveryInstructions,
      },
    });

    // ── 5. Create the order ──
    const orderNumber = await nextOrderNumber(tx);
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        fulfillmentStatus: "UNFULFILLED",
        subtotalMinor,
        discountMinor,
        deliveryFeeMinor,
        taxMinor,
        totalMinor,
        deliveryDate: new Date(input.deliveryDate),
        deliveryTimeSlotId: slot.id,
        deliveryInstructions: input.address.deliveryInstructions,
        recipientName: input.address.recipientName,
        recipientPhone: input.address.phone,
        deliveryAddressSnapshot: {
          label: address.label,
          recipientName: address.recipientName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          area: address.area,
          city: address.city,
          emirate: address.emirate,
        },
        couponId,
        notes: input.notes,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    // ── 6. Reserve inventory + write transactions (never trust browser-supplied stock) ──
    for (const r of reservations) {
      await tx.inventoryItem.update({
        where: { productId: r.productId },
        data: { reservedQuantity: { increment: r.quantity } },
      });
      await tx.inventoryTransaction.create({
        data: {
          productId: r.productId,
          type: "RESERVATION",
          quantity: -r.quantity,
          referenceType: "Order",
          referenceId: order.id,
          notes: `Reserved for order ${orderNumber}`,
        },
      });
    }

    // ── 7. Coupon usage bookkeeping ──
    if (couponId) {
      await tx.couponUsage.create({
        data: { couponId, customerId: customer.id, orderId: order.id, discountMinor },
      });
      await tx.coupon.update({ where: { id: couponId }, data: { usageCount: { increment: 1 } } });
    }

    // ── 8. Payment shell — the provider session is created outside this transaction (network call) ──
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: process.env.PAYMENT_PROVIDER ?? "ziina",
        amountMinor: totalMinor,
        currency: "AED",
        status: "PENDING",
      },
    });

    return { order, payment, customer };
  });
}
