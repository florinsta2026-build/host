"use client";

import { useState, useTransition } from "react";
import { toggleProductAvailability, toggleProductFeatured, updateProductPrice } from "@/lib/products/admin-actions";
import { formatMoney, majorToMinor, minorToMajor } from "@/lib/utils/money";

export function ProductRowControls({
  productId,
  isAvailable,
  isFeatured,
  priceMinor,
}: {
  productId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  priceMinor: number;
}) {
  const [available, setAvailable] = useState(isAvailable);
  const [featured, setFeatured] = useState(isFeatured);
  const [price, setPrice] = useState(minorToMajor(priceMinor).toString());
  const [editingPrice, setEditingPrice] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4">
      {editingPrice ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.01"
            className="w-20 rounded-lg border border-ink/15 px-2 py-1 text-sm"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button
            className="text-xs text-rose-deep"
            onClick={() =>
              startTransition(async () => {
                await updateProductPrice(productId, majorToMinor(parseFloat(price)));
                setEditingPrice(false);
              })
            }
          >
            Save
          </button>
        </div>
      ) : (
        <button onClick={() => setEditingPrice(true)} className="text-sm underline decoration-dotted">
          {formatMoney(majorToMinor(parseFloat(price)))}
        </button>
      )}

      <label className="flex items-center gap-1.5 text-xs">
        <input
          type="checkbox"
          checked={available}
          disabled={pending}
          onChange={(e) => {
            setAvailable(e.target.checked);
            startTransition(() => toggleProductAvailability(productId, e.target.checked));
          }}
        />
        Available
      </label>

      <label className="flex items-center gap-1.5 text-xs">
        <input
          type="checkbox"
          checked={featured}
          disabled={pending}
          onChange={(e) => {
            setFeatured(e.target.checked);
            startTransition(() => toggleProductFeatured(productId, e.target.checked));
          }}
        />
        Featured
      </label>
    </div>
  );
}
