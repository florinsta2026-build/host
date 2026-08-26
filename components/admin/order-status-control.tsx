"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, addOrderNote } from "@/lib/orders/admin-actions";
import type { OrderStatus } from "@prisma/client";

const NEXT_STATUS_OPTIONS: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED",
];

export function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [status, setStatus] = useState(currentStatus);
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);

  function handleChange(next: OrderStatus) {
    if (next === "CANCELLED" && !confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    startTransition(async () => {
      await updateOrderStatus(orderId, next);
      setStatus(next);
      setConfirmCancel(false);
    });
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink-soft mb-1.5">Order status</label>
      <select
        value={status}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        className="rounded-xl border border-ink/15 px-4 py-2 text-sm"
      >
        {NEXT_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
        ))}
      </select>
      {confirmCancel && (
        <div className="mt-2 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="mb-2">Cancelling releases any reserved stock. This does not automatically refund a paid order — issue a refund through Ziina separately if needed.</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleChange("CANCELLED")}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs"
            >
              Confirm cancel
            </button>
            <button onClick={() => setConfirmCancel(false)} className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs">
              Keep order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderNoteForm({ orderId, initialNote }: { orderId: string; initialNote: string | null }) {
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink-soft mb-1.5">Internal notes</label>
      <textarea
        className="w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm"
        rows={3}
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
      />
      <button
        disabled={pending}
        onClick={() => startTransition(async () => { await addOrderNote(orderId, note); setSaved(true); })}
        className="mt-2 px-4 py-2 rounded-xl bg-ink text-white text-xs"
      >
        {pending ? "Saving…" : saved ? "Saved ✓" : "Save note"}
      </button>
    </div>
  );
}
