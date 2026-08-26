import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/db/admin-orders";
import { formatMoney } from "@/lib/utils/money";
import { OrderStatusControl, OrderNoteForm } from "@/components/admin/order-status-control";

export const metadata = { title: "Order detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const address = order.deliveryAddressSnapshot as {
    addressLine1: string; addressLine2?: string; area: string; city: string; emirate: string;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="serif text-2xl">{order.orderNumber}</h1>
          <p className="text-sm text-ink-soft">Placed {new Date(order.createdAt).toLocaleString("en-AE")}</p>
        </div>
        <a href={`/admin/orders/${order.id}/print`} target="_blank" className="px-4 py-2 rounded-xl border border-ink/15 text-sm">
          Print packing slip
        </a>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-ink/10">
            <h2 className="serif text-lg mb-3">Items</h2>
            <table className="w-full text-sm">
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-ink/5 last:border-0">
                    <td className="py-2">{item.productNameSnapshot} <span className="text-ink-soft">({item.skuSnapshot})</span></td>
                    <td className="py-2 text-ink-soft text-right">× {item.quantity}</td>
                    <td className="py-2 text-right font-medium">{formatMoney(item.totalMinor, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-ink/10 mt-3 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>{formatMoney(order.subtotalMinor, order.currency)}</span></div>
              {order.discountMinor > 0 && <div className="flex justify-between"><span className="text-ink-soft">Discount {order.coupon ? `(${order.coupon.code})` : ""}</span><span>-{formatMoney(order.discountMinor, order.currency)}</span></div>}
              <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><span>{formatMoney(order.deliveryFeeMinor, order.currency)}</span></div>
              {order.taxMinor > 0 && <div className="flex justify-between"><span className="text-ink-soft">Tax</span><span>{formatMoney(order.taxMinor, order.currency)}</span></div>}
              <div className="flex justify-between font-medium text-base pt-2 border-t border-ink/10"><span>Total</span><span>{formatMoney(order.totalMinor, order.currency)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-ink/10">
            <h2 className="serif text-lg mb-3">Delivery</h2>
            <p className="text-sm">{order.recipientName} · {order.recipientPhone}</p>
            <p className="text-sm text-ink-soft mt-1">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.area}, {address.city}, {address.emirate}</p>
            <p className="text-sm text-ink-soft mt-1">{new Date(order.deliveryDate).toLocaleDateString("en-AE", { weekday: "long", month: "long", day: "numeric" })} — {order.deliveryTimeSlot?.name}</p>
            {order.deliveryInstructions && <p className="text-sm text-ink-soft mt-1">Note: {order.deliveryInstructions}</p>}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-ink/10">
            <h2 className="serif text-lg mb-3">Activity log</h2>
            {order.auditLogs.length === 0 ? (
              <p className="text-sm text-ink-soft">No changes recorded yet.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {order.auditLogs.map((log) => (
                  <li key={log.id} className="border-b border-ink/5 pb-2 last:border-0">
                    <span className="text-ink-soft">{new Date(log.createdAt).toLocaleString("en-AE")}</span> — {log.action.replace(/_/g, " ")} {log.user ? `by ${log.user.name}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-ink/10 space-y-4">
            <OrderStatusControl orderId={order.id} currentStatus={order.status} />
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-soft mb-1.5">Payment status</p>
              <p className="text-sm font-medium">{order.paymentStatus}</p>
              {order.payments[0]?.provider && (
                <p className="text-xs text-ink-soft mt-1">via {order.payments[0].provider}{order.payments[0].providerPaymentId ? ` · ${order.payments[0].providerPaymentId}` : ""}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-ink/10">
            <h2 className="serif text-lg mb-3">Customer</h2>
            <p className="text-sm">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="text-sm text-ink-soft">{order.customer.email}</p>
            <p className="text-sm text-ink-soft">{order.customer.phone}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-ink/10">
            <OrderNoteForm orderId={order.id} initialNote={order.notes} />
          </div>
        </div>
      </div>
    </div>
  );
}
