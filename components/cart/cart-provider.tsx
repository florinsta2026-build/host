"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPriceMinor: number; // display-only snapshot; server re-prices at checkout
  quantity: number;
  selectedOptions?: { groupId: string; valueId: string; group: string; value: string; priceDeltaMinor: number }[];
};

type CartContextValue = {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  removeLine: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  subtotalMinor: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "florinsta_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted cart once on mount. This runs only on the client (after the
  // server-rendered empty-cart markup is committed) so it intentionally does not
  // run during SSR — an effect is the correct tool here, not a lazy initializer,
  // because the server has no localStorage to read from.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: CartLine[] = raw ? JSON.parse(raw) : [];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only hydration from localStorage, not a synchronization loop
      if (parsed.length > 0) setLines(parsed);
    } catch {
      /* ignore corrupt local storage */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addLine = (line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === line.productId ? { ...l, quantity: l.quantity + line.quantity } : l
        );
      }
      return [...prev, line];
    });
  };

  const removeLine = (productId: string) =>
    setLines((prev) => prev.filter((l) => l.productId !== productId));

  const setQuantity = (productId: string, quantity: number) =>
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    );

  const clear = () => setLines([]);

  const subtotalMinor = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const optionsDelta = (l.selectedOptions ?? []).reduce((s, o) => s + o.priceDeltaMinor, 0);
        return sum + (l.unitPriceMinor + optionsDelta) * l.quantity;
      }, 0),
    [lines]
  );

  const itemCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addLine, removeLine, setQuantity, clear, subtotalMinor, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
