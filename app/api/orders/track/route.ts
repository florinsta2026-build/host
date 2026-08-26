import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrderForTracking } from "@/lib/orders/lookup";
import { formatMoney } from "@/lib/utils/money";

const schema = z.object({
  orderNumber: z.string().min(1),
  contact: z.string().min(3),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter an order number and your email or phone." }, { status: 400 });
  }

  const order = await findOrderForTracking(parsed.data.orderNumber, parsed.data.contact);
  if (!order) {
    return NextResponse.json(
      { error: "We couldn't find an order matching those details." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    deliveryDate: order.deliveryDate,
    totalFormatted: formatMoney(order.totalMinor, order.currency),
    items: order.items.map((i) => ({ name: i.productNameSnapshot, quantity: i.quantity })),
  });
}
