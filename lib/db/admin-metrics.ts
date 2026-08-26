import { prisma } from "@/lib/db/prisma";

export async function getDashboardMetrics() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    todayOrders,
    todayRevenueAgg,
    pendingOrders,
    preparingOrders,
    outForDelivery,
    allInventory,
    failedPayments,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfToday }, paymentStatus: "PAID" },
      _sum: { totalMinor: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PREPARING" } }),
    prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
    prisma.inventoryItem.findMany({ include: { product: { select: { name: true, slug: true } } } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
  ]);

  const lowStockItems = allInventory.filter((i) => i.quantity <= i.lowStockThreshold).slice(0, 10);

  return {
    todayOrders,
    todayRevenueMinor: todayRevenueAgg._sum.totalMinor ?? 0,
    pendingOrders,
    preparingOrders,
    outForDelivery,
    lowStockItems,
    failedPayments,
  };
}

export async function getTopProducts(days = 30, take = 5) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "productNameSnapshot"],
    where: { order: { createdAt: { gte: since }, paymentStatus: "PAID" } },
    _sum: { quantity: true, totalMinor: true },
    orderBy: { _sum: { totalMinor: "desc" } },
    take,
  });

  return grouped.map((g) => ({
    name: g.productNameSnapshot,
    quantity: g._sum.quantity ?? 0,
    revenueMinor: g._sum.totalMinor ?? 0,
  }));
}
