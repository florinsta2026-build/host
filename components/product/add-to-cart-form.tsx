"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/utils/money";

type OptionGroup = {
  id: string;
  name: string;
  required: boolean;
  values: { id: string; label: string; priceDeltaMinor: number }[];
};

export function AddToCartForm({
  productId,
  slug,
  name,
  image,
  priceMinor,
  currency,
  optionGroups,
}: {
  productId: string;
  slug: string;
  name: string;
  image: string;
  priceMinor: number;
  currency: string;
  optionGroups: OptionGroup[];
}) {
  const { addLine } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of optionGroups) if (g.values[0]) init[g.id] = g.values[0].id;
    return init;
  });
  const [added, setAdded] = useState(false);

  const selectedOptions = optionGroups.map((g) => {
    const value = g.values.find((v) => v.id === selected[g.id]) ?? g.values[0];
    return {
      groupId: g.id,
      valueId: value?.id ?? "",
      group: g.name,
      value: value?.label ?? "",
      priceDeltaMinor: value?.priceDeltaMinor ?? 0,
    };
  });

  const optionsDelta = selectedOptions.reduce((s, o) => s + o.priceDeltaMinor, 0);
  const displayTotal = (priceMinor + optionsDelta) * quantity;

  function handleAdd() {
    addLine({
      productId,
      slug,
      name,
      image,
      unitPriceMinor: priceMinor,
      quantity,
      selectedOptions,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-6 space-y-6">
      {optionGroups.map((g) => (
        <div key={g.id}>
          <p className="text-xs uppercase tracking-wider text-ink-soft mb-2">{g.name}</p>
          <div className="flex flex-wrap gap-2">
            {g.values.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [g.id]: v.id }))}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  selected[g.id] === v.id ? "bg-ink text-white border-ink" : "border-ink/15 hover:border-ink/40"
                }`}
              >
                {v.label}
                {v.priceDeltaMinor > 0 && ` (+${formatMoney(v.priceDeltaMinor, currency)})`}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-ink/15 rounded-full">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="w-9 h-9 flex items-center justify-center"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="w-9 h-9 flex items-center justify-center"
            onClick={() => setQuantity((q) => q + 1)}
          >
            +
          </button>
        </div>
        <span className="serif text-xl">{formatMoney(displayTotal, currency)}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className="px-7 py-3 rounded-full bg-rose-deep text-white text-sm tracking-wide hover:bg-ink transition-colors"
        >
          {added ? "Added ✓" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={() => {
            handleAdd();
            router.push("/cart");
          }}
          className="px-7 py-3 rounded-full border border-ink/15 text-sm tracking-wide hover:bg-white transition-colors"
        >
          Buy now
        </button>
      </div>
      <p className="text-xs text-ink-soft">
        Final price, availability and delivery fee are confirmed at checkout.
      </p>
    </div>
  );
}
