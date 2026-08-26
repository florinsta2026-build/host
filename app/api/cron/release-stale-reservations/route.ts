import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { releaseReservedStock } from "@/lib/inventory/transitions";

const STALE_AFTER_MINUTES = 45;

/**
 * Orders stuck in PENDING/PROCESSING with no webhook after STALE_AFTER_MINUTES almost
 * always mean the customer abandoned the Ziina payment page. We release their stock
 * reservation so it becomes sellable again, and mark the order CANCELLED so it stops
 * counting against delivery slot capacity. This does NOT touch anything already PAID.
 *
 * Wire this up as a Vercel Cron job (vercel.json) hitting this route every 15 minutes.
 * Protect it with CRON_SECRET so it can't be triggered by anyone else.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: { in: ["PENDING", "PROCESSING"] },
      createdAt: { lt: cutoff },
    },
    select: { id: true, orderNumber: true },
  });

  for (const order of staleOrders) {
    await prisma.$transaction(async (tx) => {
      await releaseReservedStock(tx, order.id);
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await tx.auditLog.create({
        data: {
          action: "ORDER_AUTO_CANCELLED_STALE",
          entity: "Order",
          entityId: order.id,
          orderId: order.id,
          metadata: { reason: `No payment confirmation after ${STALE_AFTER_MINUTES} minutes` },
        },
      });
    });
  }

  return NextResponse.json({ releasedCount: staleOrders.length, orderNumbers: staleOrders.map((o) => o.orderNumber) });
}
