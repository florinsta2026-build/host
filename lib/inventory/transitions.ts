import type { Prisma } from "@prisma/client";

/**
 * Payment succeeded: the reservation becomes a real stock deduction.
 */
export async function commitReservedStock(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true, quantity: true } });

  for (const item of items) {
    if (!item.productId) continue;
    const inventory = await tx.inventoryItem.findUnique({ where: { productId: item.productId } });
    if (!inventory) continue; // stock tracking not enabled for this product

    await tx.inventoryItem.update({
      where: { productId: item.productId },
      data: {
        quantity: { decrement: item.quantity },
        reservedQuantity: { decrement: item.quantity },
      },
    });
    await tx.inventoryTransaction.create({
      data: {
        productId: item.productId,
        type: "SALE",
        quantity: -item.quantity,
        referenceType: "Order",
        referenceId: orderId,
        notes: "Payment confirmed — stock committed",
      },
    });
  }
}

/**
 * Payment failed or order cancelled before payment: give the reserved stock back.
 */
export async function releaseReservedStock(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true, quantity: true } });

  for (const item of items) {
    if (!item.productId) continue;
    const inventory = await tx.inventoryItem.findUnique({ where: { productId: item.productId } });
    if (!inventory) continue;

    await tx.inventoryItem.update({
      where: { productId: item.productId },
      data: { reservedQuantity: { decrement: Math.min(item.quantity, inventory.reservedQuantity) } },
    });
    await tx.inventoryTransaction.create({
      data: {
        productId: item.productId,
        type: "RELEASE",
        quantity: item.quantity,
        referenceType: "Order",
        referenceId: orderId,
        notes: "Payment failed/cancelled — reservation released",
      },
    });
  }
}
