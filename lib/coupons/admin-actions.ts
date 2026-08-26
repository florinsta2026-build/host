"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { majorToMinor } from "@/lib/utils/money";

const couponFormSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minimumOrder: z.number().min(0).optional(),
  maximumDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().default(1),
  expiresAt: z.string().optional(),
});

export async function createCoupon(input: z.infer<typeof couponFormSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = couponFormSchema.parse(input);

  if (parsed.type === "PERCENTAGE" && parsed.value > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }

  await prisma.coupon.create({
    data: {
      code: parsed.code.trim().toUpperCase(),
      type: parsed.type,
      value: parsed.type === "FIXED" ? majorToMinor(parsed.value) : Math.round(parsed.value),
      minimumOrderMinor: parsed.minimumOrder ? majorToMinor(parsed.minimumOrder) : null,
      maximumDiscountMinor: parsed.maximumDiscount ? majorToMinor(parsed.maximumDiscount) : null,
      usageLimit: parsed.usageLimit ?? null,
      perCustomerLimit: parsed.perCustomerLimit,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      isActive: true,
    },
  });

  revalidatePath("/admin/coupons");
}

export async function toggleCouponActive(couponId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.coupon.update({ where: { id: couponId }, data: { isActive } });
  revalidatePath("/admin/coupons");
}
