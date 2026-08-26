import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createPendingOrder, CheckoutError } from "@/lib/orders/create-order";
import { getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout data.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let orderResult;
  try {
    orderResult = await createPendingOrder(parsed.data);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
    }
    console.error("Checkout order creation failed:", err);
    return NextResponse.json({ error: "We couldn't process your order. Please try again." }, { status: 500 });
  }

  const { order, payment } = orderResult;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://florinstauae.com";

  try {
    const provider = getPaymentProvider();
    const session = await provider.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountMinor: order.totalMinor,
      currency: order.currency,
      successUrl: `${siteUrl}/order-confirmation/${order.trackingToken}`,
      cancelUrl: `${siteUrl}/checkout?orderNumber=${order.orderNumber}&cancelled=1`,
      customerEmail: parsed.data.customer.email,
      description: `Florinsta order ${order.orderNumber}`,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerPaymentId: session.providerPaymentId, status: "PROCESSING" },
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      trackingToken: order.trackingToken,
      redirectUrl: session.redirectUrl,
    });
  } catch (err) {
    // The order and stock reservation already exist and are valid — the customer can retry
    // payment for this same order rather than us creating a duplicate. We surface the order
    // number so a future "retry payment" flow (or admin) can pick it back up.
    console.error("Payment session creation failed:", err);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return NextResponse.json(
      {
        error:
          "Your order was saved but we couldn't start the payment. Please try again or contact us on WhatsApp.",
        orderNumber: order.orderNumber,
      },
      { status: 502 }
    );
  }
}
