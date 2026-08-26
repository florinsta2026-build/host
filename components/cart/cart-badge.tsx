"use client";

import { useCart } from "./cart-provider";

export function CartBadge() {
  const { itemCount } = useCart();
  if (itemCount === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-rose-deep text-white text-[.65rem] w-5 h-5 rounded-full flex items-center justify-center">
      {itemCount}
    </span>
  );
}
