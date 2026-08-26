"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.product.update({ where: { id: productId }, data: { isAvailable } });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_AVAILABILITY_CHANGED",
      entity: "Product",
      entityId: productId,
      metadata: { isAvailable },
    },
  });
  revalidatePath("/admin/products");
}

export async function toggleProductFeatured(productId: string, isFeatured: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.product.update({ where: { id: productId }, data: { isFeatured } });
  revalidatePath("/admin/products");
}

export async function updateProductPrice(productId: string, priceMinor: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!Number.isInteger(priceMinor) || priceMinor < 0) throw new Error("Invalid price");

  const before = await prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { priceMinor: true } });
  await prisma.product.update({ where: { id: productId }, data: { priceMinor } });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_PRICE_CHANGED",
      entity: "Product",
      entityId: productId,
      metadata: { from: before.priceMinor, to: priceMinor },
    },
  });
  revalidatePath("/admin/products");
}
