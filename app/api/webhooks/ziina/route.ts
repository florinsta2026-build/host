import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { commitReservedStock, releaseReservedStock } from "@/lib/inventory/transitions";
import { sendEmail, orderConfirmationEmail } from "@/lib/email/send";
import { formatMoney } from "@/lib/utils/money";

// Webhooks must be processed with a raw, un-parsed body so the HMAC signature check
// operates over the exact bytes Ziina signed.
export async function POST(request: Request) {
  const rawBody = await request.text();

  const provider = getPaymentProvider();

  let event;
  try {
    event = await provider.handleWebhook(rawBody, request.headers);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");

  // ── Idempotency: if we've already processed this exact event, acknowledge and stop. ──
  const alreadyProcessed = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: provider.name, eventId: event.eventId } },
  });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!event.providerPaymentId) {
    // Nothing actionable (e.g. a refund event we don't yet handle) — still record it to stay idempotent.
    await prisma.webhookEvent.create({
      data: { provider: provider.name, eventId: event.eventId, eventType: event.eventType, payloadHash },
    });
    return NextResponse.json({ received: true });
  }

  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId: event.providerPaymentId },
    include: { order: true },
  });

  if (!payment) {
    console.warn(`Webhook for unknown providerPaymentId ${event.providerPaymentId}`);
    await prisma.webhookEvent.create({
      data: { provider: provider.name, eventId: event.eventId, eventType: event.eventType, payloadHash },
    });
    return NextResponse.json({ received: true });
  }

  // Don't trust the webhook's own status blindly for the paid transition — re-fetch
  // directly from Ziina's API as the authoritative source before crediting the order.
  const verified = event.status === "paid" ? await provider.verifyPayment(event.providerPaymentId) : null;

  await prisma.$transaction(async (tx) => {
    await tx.webhookEvent.create({
      data: { provider: provider.name, eventId: event.eventId, eventType: event.eventType, payloadHash },
    });

    if (payment.status === "PAID" || payment.status === "REFUNDED") {
      return; // already settled, nothing to do
    }

    if (verified?.status === "paid") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date(), metadata: verified.raw },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
      await commitReservedStock(tx, payment.orderId);
    } else if (event.status === "failed") {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "FAILED" } });
      await releaseReservedStock(tx, payment.orderId);
    }
    // "processing" / "requires_action" — no state change yet, wait for the next event.
  });

  // Fire the confirmation email outside the transaction (best-effort, non-blocking failures shouldn't roll back payment state).
  if (verified?.status === "paid") {
    const order = await prisma.order.findUnique({ where: { id: payment.orderId }, include: { customer: true } });
    if (order) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://florinstauae.com";
      const { subject, html } = orderConfirmationEmail({
        orderNumber: order.orderNumber,
        recipientName: order.recipientName,
        totalFormatted: formatMoney(order.totalMinor, order.currency),
        trackingUrl: `${siteUrl}/order-confirmation/${order.trackingToken}`,
      });
      await sendEmail({ to: order.customer.email, subject, html });
    }
  }

  return NextResponse.json({ received: true });
}
