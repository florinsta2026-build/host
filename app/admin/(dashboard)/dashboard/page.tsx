import Link from "next/link";
import { getDashboardMetrics, getTopProducts } from "@/lib/db/admin-metrics";
import { formatMoney } from "@/lib/utils/money";

export const metadata = { title: "Dashboard" };

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <div className="bg-white rounded-2xl p-5 border border-ink/10">
      <p className="text-xs uppercase tracking-wider text-ink-soft mb-1">{label}</p>
      <p className="text-2xl serif">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function AdminDashboardPage() {
  const [metrics, topProducts] = await Promise.all([getDashboardMetrics(), getTopProducts()]);

  return (
    <div>
      <h1 className="serif text-2xl mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's orders" value={metrics.todayOrders} href="/admin/orders" />
        <StatCard label="Today's revenue" value={formatMoney(metrics.todayRevenueMinor)} />
        <StatCard label="Pending orders" value={metrics.pendingOrders} href="/admin/orders?status=PENDING" />
        <StatCard label="Preparing" value={metrics.preparingOrders} href="/admin/orders?status=PREPARING" />
        <StatCard label="Out for delivery" value={metrics.outForDelivery} href="/admin/orders?status=OUT_FOR_DELIVERY" />
        <StatCard label="Low stock items" value={metrics.lowStockItems.length} href="/admin/inventory" />
        <StatCard label="Failed payments" value={metrics.failedPayments} href="/admin/orders?paymentStatus=FAILED" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-ink/10">
          <h2 className="serif text-lg mb-3">Top products (30 days)</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink-soft">No paid orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name} className="border-t border-ink/5">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-ink-soft text-right">{p.quantity} sold</td>
                    <td className="py-2 text-right font-medium">{formatMoney(p.revenueMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-ink/10">
          <h2 className="serif text-lg mb-3">Low stock</h2>
          {metrics.lowStockItems.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing low on stock.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {metrics.lowStockItems.map((item) => (
                <li key={item.id} className="flex justify-between border-t border-ink/5 pt-2 first:border-t-0 first:pt-0">
                  <span>{item.product.name}</span>
                  <span className="text-rose-deep font-medium">{item.quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
