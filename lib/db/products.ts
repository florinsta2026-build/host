import { prisma } from "./prisma";

export function getFeaturedProducts(take = 8) {
  return prisma.product.findMany({
    where: { status: "PUBLISHED", isAvailable: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
    include: { category: true },
  });
}

export function getProductsByCategory(categorySlug?: string) {
  return prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      isAvailable: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      options: { include: { values: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
      inventory: true,
    },
  });
}

export function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}
