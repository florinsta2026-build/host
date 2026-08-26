import { prisma } from "@/lib/db/prisma";

export function getOrderByTrackingToken(token: string) {
  return prisma.order.findUnique({
    where: { trackingToken: token },
    include: { items: true, customer: true, deliveryTimeSlot: true, payments: true },
  });
}

/**
 * Public order tracking requires the order number PLUS the email or phone on the order —
 * knowing a sequential order number alone is never sufficient to see someone else's order.
 */
export async function findOrderForTracking(orderNumber: string, emailOrPhone: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: { items: true, customer: true, deliveryTimeSlot: true },
  });

  if (!order) return null;

  const needle = emailOrPhone.trim().toLowerCase();
  const matches =
    order.customer.email.toLowerCase() === needle ||
    order.customer.phone.replace(/\s|-/g, "") === needle.replace(/\s|-/g, "") ||
    order.recipientPhone.replace(/\s|-/g, "") === needle.replace(/\s|-/g, "");

  return matches ? order : null;
}
