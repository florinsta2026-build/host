import type { Prisma } from "@prisma/client";

const PREFIX = "FLR-";
const START = 10000;

/**
 * Generates the next sequential order number. Must be called with the active
 * transaction client so two concurrent checkouts can never collide on the same number.
 */
export async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const last = await tx.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  const lastSeq = last ? parseInt(last.orderNumber.replace(PREFIX, ""), 10) : START - 1;
  const nextSeq = Number.isFinite(lastSeq) ? lastSeq + 1 : START;
  return `${PREFIX}${nextSeq}`;
}
