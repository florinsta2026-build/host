/**
 * Provider-agnostic payment abstraction.
 *
 * Rules enforced by every implementation:
 *  - Never receives or stores card numbers/CVV/expiry — the customer pays on the
 *    provider's own hosted page, we only ever see a payment/session ID and a status.
 *  - createCheckoutSession() returning a redirect URL is NOT proof of payment.
 *    Only verifyPayment() (server calling the provider directly) or a verified
 *    webhook is trusted to mark an order paid.
 */

export type CreateCheckoutSessionParams = {
  orderId: string;
  orderNumber: string;
  amountMinor: number; // integer minor units (fils for AED)
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  description?: string;
  testMode?: boolean;
};

export type CheckoutSessionResult = {
  providerPaymentId: string;
  redirectUrl: string;
};

export type PaymentVerificationStatus =
  | "requires_payment"
  | "processing"
  | "requires_action"
  | "paid"
  | "failed";

export type PaymentVerificationResult = {
  providerPaymentId: string;
  status: PaymentVerificationStatus;
  amountMinor: number;
  currency: string;
  raw: Record<string, unknown>; // safe, non-sensitive metadata only — never card data
};

export type RefundResult = {
  providerRefundId: string;
  status: "pending" | "succeeded" | "failed";
  amountMinor: number;
};

export type VerifiedWebhookEvent = {
  eventId: string;
  eventType: string;
  providerPaymentId: string | null;
  status: PaymentVerificationStatus | null;
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult>;
  verifyPayment(providerPaymentId: string): Promise<PaymentVerificationResult>;
  refundPayment(providerPaymentId: string, amountMinor: number): Promise<RefundResult>;
  /**
   * Verifies the raw webhook request (signature + origin) and returns a normalized event.
   * Throws if the signature is invalid — callers must reject the request (401/400) on throw.
   */
  handleWebhook(rawBody: string, headers: Headers): Promise<VerifiedWebhookEvent>;
}
