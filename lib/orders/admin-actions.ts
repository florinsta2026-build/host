"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { releaseReservedStock } from "@/lib/inventory/transitions";
import type { OrderStatus, FulfillmentStatus } from "@prisma/client";

export const STATUS_TO_FULFILLMENT: Partial<Record<OrderStatus, FulfillmentStatus>> = {
  PREPARING: "PREPARING",
  READY_FOR_DELIVERY: "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
};

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });

    if (newStatus === "CANCELLED" && order.status !== "CANCELLED") {
      // Only release stock for orders that hadn't already shipped; refunding payment
      // (if paid) must be triggered separately through the provider, never assumed here.
      await releaseReservedStock(tx, orderId);
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        fulfillmentStatus: STATUS_TO_FULFILLMENT[newStatus] ?? order.fulfillmentStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORDER_STATUS_CHANGED",
        entity: "Order",
        entityId: orderId,
        orderId,
        metadata: { from: order.status, to: newStatus, note: note ?? null },
      },
    });
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function addOrderNote(orderId: string, note: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.order.update({ where: { id: orderId }, data: { notes: note } });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ORDER_NOTE_ADDED",
      entity: "Order",
      entityId: orderId,
      orderId,
      metadata: { note },
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}
