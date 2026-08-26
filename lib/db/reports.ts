import { prisma } from "@/lib/db/prisma";

export async function getSalesReport(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to }, paymentStatus: "PAID" },
    include: { items: true },
  });

  const totalSalesMinor = orders.reduce((s, o) => s + o.totalMinor, 0);
  const orderCount = orders.length;
  const averageOrderValueMinor = orderCount > 0 ? Math.round(totalSalesMinor / orderCount) : 0;

  const byStatus = await prisma.order.groupBy({
    by: ["status"],
    where: { createdAt: { gte: from, lte: to } },
    _count: true,
  });

  const refunds = await prisma.payment.aggregate({
    where: { updatedAt: { gte: from, lte: to }, status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] } },
    _sum: { refundedAmountMinor: true },
    _count: true,
  });

  return {
    totalSalesMinor,
    orderCount,
    averageOrderValueMinor,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    refundsCount: refunds._count,
    refundsTotalMinor: refunds._sum.refundedAmountMinor ?? 0,
    orders,
  };
}

export function ordersToCsv(orders: { orderNumber: string; createdAt: Date; status: string; paymentStatus: string; totalMinor: number; currency: string }[]) {
  const header = ["Order Number", "Date", "Status", "Payment Status", "Total"];
  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt.toISOString(),
    o.status,
    o.paymentStatus,
    (o.totalMinor / 100).toFixed(2) + " " + o.currency,
  ]);
  return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
