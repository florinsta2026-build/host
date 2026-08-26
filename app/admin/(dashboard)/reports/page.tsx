import { getSalesReport } from "@/lib/db/reports";
import { formatMoney } from "@/lib/utils/money";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const to = new Date();
  const from = new Date();
  const days = range === "7" ? 7 : range === "90" ? 90 : range === "1" ? 1 : 30;
  from.setDate(from.getDate() - days);

  const report = await getSalesReport(from, to);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="serif text-2xl">Reports</h1>
        <div className="flex gap-2">
          {[["1", "Today"], ["7", "7 days"], ["30", "30 days"], ["90", "90 days"]].map(([value, label]) => (
            <a
              key={value}
              href={`/admin/reports?range=${value}`}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                (range ?? "30") === value ? "bg-ink text-white" : "border-ink/15"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-ink/10">
          <p className="text-xs uppercase tracking-wider text-ink-soft mb-1">Total sales</p>
          <p className="text-2xl serif">{formatMoney(report.totalSalesMinor)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-ink/10">
          <p className="text-xs uppercase tracking-wider text-ink-soft mb-1">Paid orders</p>
          <p className="text-2xl serif">{report.orderCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-ink/10">
          <p className="text-xs uppercase tracking-wider text-ink-soft mb-1">Average order value</p>
          <p className="text-2xl serif">{formatMoney(report.averageOrderValueMinor)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-ink/10">
          <p className="text-xs uppercase tracking-wider text-ink-soft mb-1">Refunds</p>
          <p className="text-2xl serif">{formatMoney(report.refundsTotalMinor)}</p>
          <p className="text-xs text-ink-soft">{report.refundsCount} refund(s)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-ink/10 mb-8">
        <h2 className="serif text-lg mb-3">Orders by status</h2>
        <div className="flex flex-wrap gap-4">
          {report.byStatus.map((s) => (
            <div key={s.status} className="text-sm">
              <span className="text-ink-soft">{s.status.replace(/_/g, " ")}:</span>{" "}
              <span className="font-medium">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href={`/api/admin/reports/export?from=${from.toISOString()}&to=${to.toISOString()}`}
        className="inline-block px-4 py-2 rounded-xl bg-ink text-white text-sm"
      >
        Export orders CSV
      </a>
    </div>
  );
}
