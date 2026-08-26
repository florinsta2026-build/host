"use client";

import { useState } from "react";

type TrackResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  deliveryDate: string;
  totalFormatted: string;
  items: { name: string; quantity: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending payment",
  CONFIRMED: "Confirmed",
  PREPARING: "Being prepared",
  READY_FOR_DELIVERY: "Ready for delivery",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, contact }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto w-[92%] max-w-[560px] py-16">
      <h1 className="section-title text-[clamp(1.9rem,3.4vw,2.7rem)] mb-2">Track your order</h1>
      <p className="text-ink-soft mb-8">Enter your order number and the email or phone used at checkout.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-soft mb-1.5">Order number</label>
          <input
            className="w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-2.5 text-sm"
            placeholder="FLR-10001"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-soft mb-1.5">Email or phone</label>
          <input
            className="w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-2.5 text-sm"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-7 py-3 rounded-full bg-rose-deep text-white text-sm tracking-wide hover:bg-ink transition-colors disabled:opacity-60"
        >
          {loading ? "Searching…" : "Track order"}
        </button>
      </form>

      {error && <p className="text-sm text-rose-deep mt-6">{error}</p>}

      {result && (
        <div className="mt-8 bg-white/70 rounded-[22px] p-6 shadow-[0_18px_45px_-18px_rgba(101,72,80,.22)]">
          <h2 className="serif text-xl mb-1">{result.orderNumber}</h2>
          <p className="text-sm text-ink-soft mb-4">
            {new Date(result.deliveryDate).toLocaleDateString("en-AE", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="mb-1">
            Status: <strong>{STATUS_LABELS[result.status] ?? result.status}</strong>
          </p>
          <p className="mb-4 text-sm text-ink-soft">Payment: {result.paymentStatus}</p>
          <ul className="text-sm space-y-1 mb-4">
            {result.items.map((i, idx) => (
              <li key={idx}>{i.name} × {i.quantity}</li>
            ))}
          </ul>
          <p className="font-medium">{result.totalFormatted}</p>
        </div>
      )}
    </div>
  );
}
