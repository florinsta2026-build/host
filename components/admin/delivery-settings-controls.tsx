"use client";

import { useState, useTransition } from "react";
import { updateDeliveryZoneFee, toggleDeliverySlotActive } from "@/lib/settings/admin-actions";
import { minorToMajor } from "@/lib/utils/money";

export function DeliveryZoneFeeInput({ zoneId, feeMinor }: { zoneId: string; feeMinor: number }) {
  const [value, setValue] = useState(minorToMajor(feeMinor).toString());
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="1"
        className="w-20 rounded-lg border border-ink/15 px-2 py-1 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        disabled={pending}
        onClick={() => startTransition(() => updateDeliveryZoneFee(zoneId, parseFloat(value)))}
        className="text-xs text-rose-deep"
      >
        Save
      </button>
    </div>
  );
}

export function DeliverySlotToggle({ slotId, isActive }: { slotId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={active}
        disabled={pending}
        onChange={(e) => {
          setActive(e.target.checked);
          startTransition(() => toggleDeliverySlotActive(slotId, e.target.checked));
        }}
      />
      Active
    </label>
  );
}
