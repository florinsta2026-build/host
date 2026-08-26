import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { ordersToCsv } from "@/lib/db/reports";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(0);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
  });

  const csv = ordersToCsv(orders);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="florinsta-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
