"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings } from "@/lib/settings/admin-actions";

const inputClass = "w-full rounded-xl border border-ink/15 px-3 py-2 text-sm";
const labelClass = "block text-xs uppercase tracking-wider text-ink-soft mb-1";

export function SiteSettingsForm({
  freeDeliveryThresholdMajor,
  sameDayCutoffTime,
  taxRatePercent,
  whatsappNumber,
}: {
  freeDeliveryThresholdMajor: number;
  sameDayCutoffTime: string;
  taxRatePercent: number;
  whatsappNumber: string;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateSiteSettings({
        freeDeliveryThresholdMajor: Number(formData.get("freeDeliveryThreshold")),
        sameDayCutoffTime: String(formData.get("sameDayCutoff")),
        taxRatePercent: Number(formData.get("taxRate")),
        whatsappNumber: String(formData.get("whatsappNumber")),
      });
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-2xl border border-ink/10 p-5 grid sm:grid-cols-2 gap-4">
      <div>
        <label className={labelClass}>Free delivery threshold (AED)</label>
        <input name="freeDeliveryThreshold" type="number" step="1" defaultValue={freeDeliveryThresholdMajor} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Same-day order cutoff time</label>
        <input name="sameDayCutoff" type="time" defaultValue={sameDayCutoffTime} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Tax rate (%)</label>
        <input name="taxRate" type="number" step="0.1" defaultValue={taxRatePercent} className={inputClass} />
        <p className="text-xs text-ink-soft mt-1">Leave at 0 unless the business has confirmed a tax rate to apply.</p>
      </div>
      <div>
        <label className={labelClass}>WhatsApp number</label>
        <input name="whatsappNumber" defaultValue={whatsappNumber} className={inputClass} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-rose-deep text-white text-sm">
          {pending ? "Saving…" : "Save settings"}
        </button>
        {saved && !pending && <span className="text-xs text-ink-soft">Saved ✓</span>}
      </div>
    </form>
  );
}
