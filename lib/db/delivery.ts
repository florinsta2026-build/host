import { prisma } from "./prisma";

export function getActiveDeliverySlots() {
  return prisma.deliverySlot.findMany({ where: { isActive: true }, orderBy: { startTime: "asc" } });
}
