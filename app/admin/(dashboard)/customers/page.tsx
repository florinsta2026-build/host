import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/utils/money";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { orders: { select: { totalMinor: true, paymentStatus: true, createdAt: true } } },
  });

  return (
    <div>
      <h1 className="serif text-2xl mb-6">Customers</h1>
      <div className="bg-white rounded-2xl border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-soft border-b border-ink/10">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spent</th>
              <th className="px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const paidOrders = c.orders.filter((o) => o.paymentStatus === "PAID");
              const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalMinor, 0);
              const lastOrder = c.orders[0]?.createdAt;
              return (
                <tr key={c.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/customers/${c.id}`} className="hover:underline">
                      {c.firstName} {c.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.email}<br />{c.phone}</td>
                  <td className="px-4 py-3">{c.orders.length}</td>
                  <td className="px-4 py-3">{formatMoney(totalSpent)}</td>
                  <td className="px-4 py-3 text-ink-soft">{lastOrder ? new Date(lastOrder).toLocaleDateString("en-AE") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
