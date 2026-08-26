import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByTrackingToken } from "@/lib/orders/lookup";
import { formatMoney } from "@/lib/utils/money";

export const metadata = { title: "Order confirmation" };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByTrackingToken(token);
  if (!order) notFound();

  const paid = order.paymentStatus === "PAID";

  return (
    <div className="container mx-auto w-[92%] max-w-[720px] py-16">
      <div className="text-center mb-10">
        <span className="eyebrow justify-center">{paid ? "Order confirmed" : "Order received"}</span>
        <h1 className="section-title text-[clamp(1.9rem,3.4vw,2.7rem)] mt-2">
          {paid ? "Thank you — your order is confirmed" : "We're finalising your payment"}
        </h1>
        <p className="text-ink-soft mt-2">Order {order.orderNumber}</p>
      </div>

      {!paid && (
        <div className="bg-blush rounded-2xl p-4 text-sm text-center mb-8">
          Payment status: <strong>{order.paymentStatus}</strong>. This page updates once your payment is confirmed —
          refresh in a moment, or contact us on WhatsApp if this persists.
        </div>
      )}

      <div className="bg-white/70 rounded-[22px] p-6 shadow-[0_18px_45px_-18px_rgba(101,72,80,.22)]">
        <h2 className="serif text-xl mb-4">Order details</h2>
        <div className="space-y-2 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productNameSnapshot} × {item.quantity}
              </span>
              <span>{formatMoney(item.totalMinor, order.currency)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-ink/10 pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>{formatMoney(order.subtotalMinor, order.currency)}</span></div>
          {order.discountMinor > 0 && (
            <div className="flex justify-between"><span className="text-ink-soft">Discount</span><span>-{formatMoney(order.discountMinor, order.currency)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><span>{order.deliveryFeeMinor === 0 ? "Free" : formatMoney(order.deliveryFeeMinor, order.currency)}</span></div>
          {order.taxMinor > 0 && (
            <div className="flex justify-between"><span className="text-ink-soft">Tax</span><span>{formatMoney(order.taxMinor, order.currency)}</span></div>
          )}
          <div className="flex justify-between font-medium text-base pt-2 border-t border-ink/10 mt-2">
            <span>Total</span><span>{formatMoney(order.totalMinor, order.currency)}</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-8">
        <div className="bg-white/70 rounded-[22px] p-6">
          <h3 className="serif text-lg mb-2">Delivery</h3>
          <p className="text-sm text-ink-soft">{order.recipientName} · {order.recipientPhone}</p>
          <p className="text-sm text-ink-soft mt-1">{new Date(order.deliveryDate).toLocaleDateString("en-AE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          {order.deliveryTimeSlot && <p className="text-sm text-ink-soft">{order.deliveryTimeSlot.name}</p>}
        </div>
        <div className="bg-white/70 rounded-[22px] p-6">
          <h3 className="serif text-lg mb-2">Need help?</h3>
          <p className="text-sm text-ink-soft mb-3">Our concierge team is one message away.</p>
          <a
            href={`https://wa.me/971568743084?text=${encodeURIComponent(`Hello Florinsta! I have a question about order ${order.orderNumber}.`)}`}
            className="text-sm text-rose-deep underline"
          >
            WhatsApp us about this order
          </a>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link href="/shop" className="text-sm text-rose-deep underline">Continue shopping</Link>
      </div>
    </div>
  );
}
