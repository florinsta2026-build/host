"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/utils/money";

export default function CartPage() {
  const { lines, setQuantity, removeLine, subtotalMinor } = useCart();

  if (lines.length === 0) {
    return (
      <div className="container mx-auto w-[92%] max-w-[1180px] py-20 text-center">
        <h1 className="section-title text-[clamp(1.9rem,3.4vw,2.7rem)] mb-3">Your cart is empty</h1>
        <p className="text-ink-soft mb-8">Browse our bouquets and baskets to get started.</p>
        <Link href="/shop" className="inline-flex px-7 py-3 rounded-full bg-rose-deep text-white text-sm">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto w-[92%] max-w-[1180px] py-14">
      <h1 className="section-title text-[clamp(1.9rem,3.4vw,2.7rem)] mb-8">Your cart</h1>

      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        <div className="space-y-4">
          {lines.map((line) => {
            const optionsDelta = (line.selectedOptions ?? []).reduce((s, o) => s + o.priceDeltaMinor, 0);
            const lineTotal = (line.unitPriceMinor + optionsDelta) * line.quantity;
            return (
              <div
                key={line.productId}
                className="flex gap-4 bg-white/70 rounded-[22px] p-4 shadow-[0_18px_45px_-18px_rgba(101,72,80,.22)]"
              >
                <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-blush-soft">
                  <Image src={line.image} alt={line.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <Link href={`/product/${line.slug}`} className="serif text-lg hover:underline">
                      {line.name}
                    </Link>
                    <button
                      onClick={() => removeLine(line.productId)}
                      aria-label="Remove item"
                      className="text-ink-soft hover:text-rose-deep text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  {line.selectedOptions?.map((o) => (
                    <p key={o.group} className="text-xs text-ink-soft">
                      {o.group}: {o.value}
                    </p>
                  ))}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-ink/15 rounded-full">
                      <button
                        className="w-8 h-8"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{line.quantity}</span>
                      <button
                        className="w-8 h-8"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-medium">{formatMoney(lineTotal)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/70 rounded-[22px] p-6 h-fit shadow-[0_18px_45px_-18px_rgba(101,72,80,.22)]">
          <h2 className="serif text-xl mb-4">Order summary</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-ink-soft">Subtotal</span>
            <span>{formatMoney(subtotalMinor)}</span>
          </div>
          <p className="text-xs text-ink-soft mb-4">
            Delivery fee, coupon and tax are calculated at checkout.
          </p>
          <Link
            href="/checkout"
            className="block text-center px-7 py-3 rounded-full bg-rose-deep text-white text-sm tracking-wide hover:bg-ink transition-colors"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
