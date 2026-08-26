/**
 * Minimal transactional email abstraction. No EMAIL_API_KEY is configured yet in this
 * environment, so sends are logged rather than dispatched — swap in Resend/Postmark/SendGrid
 * here without touching any calling code. See EMAIL_PROVIDER / EMAIL_API_KEY in .env.example.
 */
type EmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(params: EmailParams): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    console.warn(`[email] EMAIL_API_KEY not set — skipping send to ${params.to}: "${params.subject}"`);
    return;
  }

  const provider = process.env.EMAIL_PROVIDER ?? "resend";

  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Florinsta <orders@florinstauae.com>",
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend send failed (${res.status}):`, await res.text());
    }
    return;
  }

  console.warn(`[email] Unsupported EMAIL_PROVIDER "${provider}" — email not sent.`);
}

export function orderConfirmationEmail(params: {
  orderNumber: string;
  recipientName: string;
  totalFormatted: string;
  trackingUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Your Florinsta order ${params.orderNumber} is confirmed`,
    html: `
      <div style="font-family:Georgia,serif;color:#45423E;max-width:480px;margin:0 auto;padding:32px 24px;background:#EDE0CC;">
        <h1 style="font-weight:500;">Thank you for your order</h1>
        <p>Order <strong>${params.orderNumber}</strong> is confirmed and will be delivered to ${params.recipientName}.</p>
        <p style="font-size:1.2rem;">Total: <strong>${params.totalFormatted}</strong></p>
        <p><a href="${params.trackingUrl}" style="color:#A9616F;">Track your order</a></p>
      </div>
    `,
  };
}
