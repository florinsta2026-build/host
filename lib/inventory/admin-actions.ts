"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

export async function adjustInventory(productId: string, delta: number, notes: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!Number.isInteger(delta) || delta === 0) throw new Error("Enter a non-zero whole number.");

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { productId } });
    const newQuantity = item.quantity + delta;
    if (newQuantity < item.reservedQuantity) {
      throw new Error("Cannot reduce stock below the quantity currently reserved by pending orders.");
    }

    await tx.inventoryItem.update({ where: { productId }, data: { quantity: newQuantity } });
    await tx.inventoryTransaction.create({
      data: {
        productId,
        type: delta > 0 ? "PURCHASE" : "ADJUSTMENT",
        quantity: delta,
        referenceType: "Manual",
        referenceId: session.user.id,
        notes,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "INVENTORY_ADJUSTED",
        entity: "InventoryItem",
        entityId: item.id,
        metadata: { delta, notes },
      },
    });
  });

  revalidatePath("/admin/inventory");
}
