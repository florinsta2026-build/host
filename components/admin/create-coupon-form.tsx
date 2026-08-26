"use client";

import { useState, useTransition } from "react";
import { createCoupon } from "@/lib/coupons/admin-actions";

const inputClass = "w-full rounded-xl border border-ink/15 px-3 py-2 text-sm";
const labelClass = "block text-xs uppercase tracking-wider text-ink-soft mb-1";

export function CreateCouponForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createCoupon({
          code: String(formData.get("code")),
          type: formData.get("type") as "PERCENTAGE" | "FIXED",
          value: Number(formData.get("value")),
          minimumOrder: formData.get("minimumOrder") ? Number(formData.get("minimumOrder")) : undefined,
          maximumDiscount: formData.get("maximumDiscount") ? Number(formData.get("maximumDiscount")) : undefined,
          usageLimit: formData.get("usageLimit") ? Number(formData.get("usageLimit")) : undefined,
          perCustomerLimit: formData.get("perCustomerLimit") ? Number(formData.get("perCustomerLimit")) : 1,
          expiresAt: formData.get("expiresAt") ? String(formData.get("expiresAt")) : undefined,
        });
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create coupon.");
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-xl bg-ink text-white text-sm">
        + New coupon
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-2xl border border-ink/10 p-5 mb-6 grid sm:grid-cols-3 gap-4">
      <div>
        <label className={labelClass}>Code</label>
        <input name="code" required className={inputClass} placeholder="WELCOME10" />
      </div>
      <div>
        <label className={labelClass}>Type</label>
        <select name="type" className={inputClass}>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount (AED)</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Value</label>
        <input name="value" type="number" step="0.01" required className={inputClass} placeholder="10" />
      </div>
      <div>
        <label className={labelClass}>Minimum order (AED, optional)</label>
        <input name="minimumOrder" type="number" step="0.01" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Maximum discount (AED, optional)</label>
        <input name="maximumDiscount" type="number" step="0.01" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Usage limit (optional)</label>
        <input name="usageLimit" type="number" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Per-customer limit</label>
        <input name="perCustomerLimit" type="number" defaultValue={1} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Expires (optional)</label>
        <input name="expiresAt" type="date" className={inputClass} />
      </div>
      <div className="flex items-end gap-2">
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-rose-deep text-white text-sm">
          {pending ? "Creating…" : "Create coupon"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-ink/15 text-sm">
          Cancel
        </button>
      </div>
      {error && <p className="sm:col-span-3 text-sm text-rose-deep">{error}</p>}
    </form>
  );
}
