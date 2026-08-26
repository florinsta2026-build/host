"use client";

import { useState, useTransition } from "react";
import { adjustInventory } from "@/lib/inventory/admin-actions";

export function InventoryAdjustControl({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [notes, setNotes] = useState("Restock");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-rose-deep underline">
        Adjust
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        placeholder="+/- qty"
        className="w-20 rounded-lg border border-ink/15 px-2 py-1 text-xs"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
      />
      <input
        placeholder="Note"
        className="w-28 rounded-lg border border-ink/15 px-2 py-1 text-xs"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        disabled={pending}
        className="text-xs text-rose-deep"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await adjustInventory(productId, parseInt(delta, 10), notes);
              setOpen(false);
              setDelta("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed");
            }
          })
        }
      >
        Save
      </button>
      {error && <span className="text-xs text-rose-deep">{error}</span>}
    </div>
  );
}
