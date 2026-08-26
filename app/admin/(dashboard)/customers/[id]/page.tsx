import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/utils/money";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
    },
  });
  if (!customer) notFound();

  const totalSpent = customer.orders.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + o.totalMinor, 0);

  return (
    <div>
      <h1 className="serif text-2xl mb-1">{customer.firstName} {customer.lastName}</h1>
      <p className="text-sm text-ink-soft mb-6">{customer.email} · {customer.phone}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-ink/10">
          <p className="text-xs uppercase tracking-wider text-ink-soft">Orders</p>
          <p className="text-xl serif">{customer.orders.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-ink/10">
          <p className="text-xs uppercase tracking-wider text-ink-soft">Lifetime value</p>
          <p className="text-xl serif">{formatMoney(totalSpent)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-ink/10">
          <p className="text-xs uppercase tracking-wider text-ink-soft">Saved addresses</p>
          <p className="text-xl serif">{customer.addresses.length}</p>
        </div>
      </div>

      <h2 className="serif text-lg mb-3">Order history</h2>
      <div className="bg-white rounded-2xl border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {customer.orders.map((o) => (
              <tr key={o.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="hover:underline font-medium">{o.orderNumber}</Link></td>
                <td className="px-4 py-3 text-ink-soft">{new Date(o.createdAt).toLocaleDateString("en-AE")}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3 text-right">{formatMoney(o.totalMinor, o.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
