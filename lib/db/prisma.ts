import { PrismaClient } from "@prisma/client";

// Avoid exhausting DB connections in dev (hot reload creates a new client each time)
// and keep a single pooled client per serverless function instance in production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
