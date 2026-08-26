import { prisma } from "@/lib/db/prisma";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { DeliveryZoneFeeInput, DeliverySlotToggle } from "@/components/admin/delivery-settings-controls";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [settings, zones, slots] = await Promise.all([
    prisma.siteSetting.findMany(),
    prisma.deliveryZone.findMany(),
    prisma.deliverySlot.findMany({ orderBy: { startTime: "asc" } }),
  ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="serif text-2xl mb-6">Settings</h1>
        <SiteSettingsForm
          freeDeliveryThresholdMajor={
            typeof settingsMap.free_delivery_threshold_minor === "number"
              ? settingsMap.free_delivery_threshold_minor / 100
              : 300
          }
          sameDayCutoffTime={typeof settingsMap.same_day_cutoff_time === "string" ? settingsMap.same_day_cutoff_time : "15:00"}
          taxRatePercent={typeof settingsMap.tax_rate_percent === "number" ? settingsMap.tax_rate_percent : 0}
          whatsappNumber={typeof settingsMap.whatsapp_number === "string" ? settingsMap.whatsapp_number : ""}
        />
      </div>

      <div>
        <h2 className="serif text-xl mb-4">Delivery zones</h2>
        <div className="bg-white rounded-2xl border border-ink/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-soft border-b border-ink/10">
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Emirate</th>
                <th className="px-4 py-3">Fee (AED)</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">{z.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{z.emirate}</td>
                  <td className="px-4 py-3"><DeliveryZoneFeeInput zoneId={z.id} feeMinor={z.feeMinor} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="serif text-xl mb-4">Delivery time slots</h2>
        <div className="bg-white rounded-2xl border border-ink/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-soft border-b border-ink/10">
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Max orders</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.maxOrders}</td>
                  <td className="px-4 py-3"><DeliverySlotToggle slotId={s.id} isActive={s.isActive} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
