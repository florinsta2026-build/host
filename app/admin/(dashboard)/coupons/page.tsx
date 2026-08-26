import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/utils/money";
import { CreateCouponForm } from "@/components/admin/create-coupon-form";
import { CouponActiveToggle } from "@/components/admin/coupon-active-toggle";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="serif text-2xl">Coupons</h1>
      </div>

      <CreateCouponForm />

      <div className="bg-white rounded-2xl border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-soft border-b border-ink/10">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min. order</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-soft">No coupons yet.</td></tr>
            )}
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-ink/5">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3">{c.type === "PERCENTAGE" ? `${c.value}%` : formatMoney(c.value)}</td>
                <td className="px-4 py-3 text-ink-soft">{c.minimumOrderMinor ? formatMoney(c.minimumOrderMinor) : "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className="px-4 py-3 text-ink-soft">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-AE") : "Never"}</td>
                <td className="px-4 py-3"><CouponActiveToggle couponId={c.id} isActive={c.isActive} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
