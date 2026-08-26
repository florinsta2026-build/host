import Link from "next/link";
import { listOrders } from "@/lib/db/admin-orders";
import { formatMoney } from "@/lib/utils/money";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

export const metadata = { title: "Orders" };

const STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED",
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-purple-100 text-purple-800",
    READY_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
    OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-200 text-gray-700",
    REFUNDED: "bg-red-100 text-red-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; paymentStatus?: string; q?: string }>;
}) {
  const { status, paymentStatus, q } = await searchParams;
  const orders = await listOrders({
    status: status as OrderStatus | undefined,
    paymentStatus: paymentStatus as PaymentStatus | undefined,
    q,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="serif text-2xl">Orders</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order #, email, phone…"
            className="rounded-xl border border-ink/15 px-4 py-2 text-sm w-64"
          />
          <button className="px-4 py-2 rounded-xl bg-ink text-white text-sm">Search</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/admin/orders" className={`px-3 py-1.5 rounded-full text-xs border ${!status ? "bg-ink text-white" : "border-ink/15"}`}>All</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`px-3 py-1.5 rounded-full text-xs border ${status === s ? "bg-ink text-white" : "border-ink/15"}`}>
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-soft border-b border-ink/10">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-soft">No orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-ink/5 hover:bg-blush-soft/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-3">{o.customer.firstName} {o.customer.lastName}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                <td className="px-4 py-3">{formatMoney(o.totalMinor, o.currency)}</td>
                <td className="px-4 py-3 text-ink-soft">{new Date(o.createdAt).toLocaleString("en-AE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
