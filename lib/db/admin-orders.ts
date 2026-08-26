import { prisma } from "@/lib/db/prisma";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

export function listOrders(filters: { status?: OrderStatus; paymentStatus?: PaymentStatus; q?: string }) {
  return prisma.order.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
      ...(filters.q
        ? {
            OR: [
              { orderNumber: { contains: filters.q, mode: "insensitive" } },
              { customer: { email: { contains: filters.q, mode: "insensitive" } } },
              { customer: { phone: { contains: filters.q } } },
              { recipientName: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      payments: true,
      deliveryTimeSlot: true,
      coupon: true,
      auditLogs: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });
}
