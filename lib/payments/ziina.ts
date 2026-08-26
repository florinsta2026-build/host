import crypto from "node:crypto";
import type {
  PaymentProvider,
  CreateCheckoutSessionParams,
  CheckoutSessionResult,
  PaymentVerificationResult,
  PaymentVerificationStatus,
  RefundResult,
  VerifiedWebhookEvent,
} from "./types";

/**
 * Ziina Payment Intent API — https://docs.ziina.com/api-reference/payment-intent
 *
 * - Amounts are in fils (1 AED = 100 fils), same minor-unit convention we use internally.
 * - Minimum payable amount is 2 AED (200 fils) — Ziina rejects anything below that.
 * - createCheckoutSession() creates a PaymentIntent and returns Ziina's hosted `redirect_url`.
 * - Payment confirmation is NEVER taken from the browser redirect. We either poll
 *   GET /payment_intent/{id} (verifyPayment) or receive a signed webhook (handleWebhook).
 * - Webhooks are authenticated via the `X-Hmac-Signature` header: hex-encoded
 *   HMAC-SHA256 of the raw request body, keyed with PAYMENT_WEBHOOK_SECRET.
 *   Ziina also only sends webhooks from a fixed set of IPs (documented, not enforced
 *   here since serverless platforms often don't expose the caller IP reliably —
 *   the HMAC check is the authoritative one).
 */

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";

const ZIINA_STATUS_MAP: Record<string, PaymentVerificationStatus> = {
  requires_payment_instrument: "requires_payment",
  pending: "processing",
  requires_user_action: "requires_action",
  completed: "paid",
  failed: "failed",
};

function getSecretKey(): string {
  const key = process.env.PAYMENT_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYMENT_SECRET_KEY is not set. Get this from the Ziina merchant dashboard (Developers > API keys) and set it in your environment before accepting payments."
    );
  }
  return key;
}

function getWebhookSecret(): string {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "PAYMENT_WEBHOOK_SECRET is not set. Configure a webhook secret when creating your Ziina webhook (POST /webhook with a `secret`) and set the same value here."
    );
  }
  return secret;
}

async function ziinaFetch(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${ZIINA_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const message = (body.message as string) ?? `Ziina API error (${res.status})`;
    throw new Error(`Ziina request to ${path} failed: ${message}`);
  }

  return body;
}

export const ziinaProvider: PaymentProvider = {
  name: "ziina",

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    if (params.amountMinor < 200) {
      // Ziina's documented minimum payable amount is AED 2.00 (200 fils).
      throw new Error("Order total is below Ziina's minimum payable amount of AED 2.00.");
    }

    const body = await ziinaFetch("/payment_intent", {
      method: "POST",
      body: JSON.stringify({
        amount: params.amountMinor,
        currency_code: params.currency,
        message: params.description ?? `Florinsta order ${params.orderNumber}`,
        success_url: params.successUrl.includes("{PAYMENT_INTENT_ID}")
          ? params.successUrl
          : `${params.successUrl}${params.successUrl.includes("?") ? "&" : "?"}pi={PAYMENT_INTENT_ID}`,
        cancel_url: params.cancelUrl,
        test: params.testMode ?? process.env.NODE_ENV !== "production",
      }),
    });

    const redirectUrl = body.redirect_url as string | undefined;
    const id = body.id as string | undefined;
    if (!redirectUrl || !id) {
      throw new Error("Ziina did not return a redirect_url/id for the created payment intent.");
    }

    return { providerPaymentId: id, redirectUrl };
  },

  async verifyPayment(providerPaymentId: string): Promise<PaymentVerificationResult> {
    const body = await ziinaFetch(`/payment_intent/${providerPaymentId}`, { method: "GET" });
    const status = ZIINA_STATUS_MAP[body.status as string] ?? "processing";
    return {
      providerPaymentId,
      status,
      amountMinor: Number(body.amount ?? 0),
      currency: (body.currency_code as string) ?? "AED",
      raw: {
        status: body.status,
        fee_amount: body.fee_amount,
        latest_error: body.latest_error,
      },
    };
  },

  async refundPayment(providerPaymentId: string, amountMinor: number): Promise<RefundResult> {
    const body = await ziinaFetch("/refund", {
      method: "POST",
      body: JSON.stringify({
        payment_intent_id: providerPaymentId,
        amount: amountMinor,
        test: process.env.NODE_ENV !== "production",
      }),
    });

    const status = (body.status as string) === "succeeded" ? "succeeded" : (body.status as string) === "failed" ? "failed" : "pending";
    return {
      providerRefundId: body.id as string,
      status,
      amountMinor,
    };
  },

  async handleWebhook(rawBody: string, headers: Headers): Promise<VerifiedWebhookEvent> {
    const signature = headers.get("x-hmac-signature");
    if (!signature) {
      throw new Error("Missing X-Hmac-Signature header on Ziina webhook request.");
    }

    const expected = crypto.createHmac("sha256", getWebhookSecret()).update(rawBody).digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    const valid =
      sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!valid) {
      throw new Error("Invalid Ziina webhook signature.");
    }

    const payload = JSON.parse(rawBody) as {
      event: string;
      data?: { id?: string; status?: string; payment_intent_id?: string };
    };

    const providerPaymentId = payload.data?.id ?? payload.data?.payment_intent_id ?? null;
    const status = payload.data?.status ? ZIINA_STATUS_MAP[payload.data.status] ?? null : null;

    return {
      // Ziina doesn't document a dedicated webhook event ID, so we derive a stable
      // one from the event type + payment id + status for idempotency purposes.
      // If Ziina later adds a real event ID field, prefer that instead.
      eventId: `${payload.event}:${providerPaymentId}:${payload.data?.status ?? ""}`,
      eventType: payload.event,
      providerPaymentId,
      status,
      raw: payload as unknown as Record<string, unknown>,
    };
  },
};
