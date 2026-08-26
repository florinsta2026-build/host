"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { majorToMinor } from "@/lib/utils/money";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function updateSiteSettings(input: {
  freeDeliveryThresholdMajor: number;
  sameDayCutoffTime: string;
  taxRatePercent: number;
  whatsappNumber: string;
}) {
  await requireAdmin();

  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: "free_delivery_threshold_minor" },
      update: { value: majorToMinor(input.freeDeliveryThresholdMajor) },
      create: { key: "free_delivery_threshold_minor", value: majorToMinor(input.freeDeliveryThresholdMajor) },
    }),
    prisma.siteSetting.upsert({
      where: { key: "same_day_cutoff_time" },
      update: { value: input.sameDayCutoffTime },
      create: { key: "same_day_cutoff_time", value: input.sameDayCutoffTime },
    }),
    prisma.siteSetting.upsert({
      where: { key: "tax_rate_percent" },
      update: { value: input.taxRatePercent },
      create: { key: "tax_rate_percent", value: input.taxRatePercent },
    }),
    prisma.siteSetting.upsert({
      where: { key: "whatsapp_number" },
      update: { value: input.whatsappNumber },
      create: { key: "whatsapp_number", value: input.whatsappNumber },
    }),
  ]);

  revalidatePath("/admin/settings");
}

export async function updateDeliveryZoneFee(zoneId: string, feeMajor: number) {
  await requireAdmin();
  await prisma.deliveryZone.update({ where: { id: zoneId }, data: { feeMinor: majorToMinor(feeMajor) } });
  revalidatePath("/admin/settings");
}

export async function toggleDeliverySlotActive(slotId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.deliverySlot.update({ where: { id: slotId }, data: { isActive } });
  revalidatePath("/admin/settings");
}
