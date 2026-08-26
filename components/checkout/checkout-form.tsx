"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/utils/money";

const formSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  recipientName: z.string().min(1, "Required"),
  recipientPhone: z.string().min(7, "Enter a valid phone number"),
  addressLine1: z.string().min(3, "Required"),
  addressLine2: z.string().optional(),
  area: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  emirate: z.string().min(1, "Required"),
  deliveryInstructions: z.string().optional(),
  deliveryDate: z.string().min(1, "Choose a date"),
  deliverySlotId: z.string().min(1, "Choose a time slot"),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-2.5 text-sm focus:outline-none focus:border-rose-deep";
const labelClass = "block text-xs uppercase tracking-wider text-ink-soft mb-1.5";

export function CheckoutForm({ slots }: { slots: { id: string; name: string }[] }) {
  const { lines, subtotalMinor, clear } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { city: "Dubai", emirate: "Dubai" },
  });

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function onSubmit(values: FormValues) {
    if (lines.length === 0) return;
    setSubmitting(true);
    setServerError(null);

    const payload = {
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
      address: {
        recipientName: values.recipientName,
        phone: values.recipientPhone,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        area: values.area,
        city: values.city,
        emirate: values.emirate,
        deliveryInstructions: values.deliveryInstructions,
      },
      items: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        selectedOptionValueIds: Object.fromEntries(
          (l.selectedOptions ?? []).map((o) => [o.groupId, o.valueId])
        ),
      })),
      deliveryDate: values.deliveryDate,
      deliverySlotId: values.deliverySlotId,
      couponCode: values.couponCode || undefined,
      notes: values.notes,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      clear();
      // eslint-disable-next-line react-hooks/immutability -- full-page navigation to an external (Ziina) URL, not a render-time mutation
      window.location.href = data.redirectUrl; // hand off to Ziina's hosted payment page
    } catch {
      setServerError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <p className="text-ink-soft">
        Your cart is empty.{" "}
        <button onClick={() => router.push("/shop")} className="underline">
          Go shopping
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr_320px] gap-10">
      <div className="space-y-10">
        <section>
          <h2 className="serif text-xl mb-4">1. Your details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input className={inputClass} {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-rose-deep mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input className={inputClass} {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-rose-deep mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} {...register("email")} />
              {errors.email && <p className="text-xs text-rose-deep mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} {...register("phone")} placeholder="+971 5x xxx xxxx" />
              {errors.phone && <p className="text-xs text-rose-deep mt-1">{errors.phone.message}</p>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="serif text-xl mb-4">2. Delivery address</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Recipient name</label>
              <input className={inputClass} {...register("recipientName")} />
              {errors.recipientName && <p className="text-xs text-rose-deep mt-1">{errors.recipientName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Recipient phone</label>
              <input className={inputClass} {...register("recipientPhone")} placeholder="+971 5x xxx xxxx" />
              {errors.recipientPhone && <p className="text-xs text-rose-deep mt-1">{errors.recipientPhone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address line 1</label>
              <input className={inputClass} {...register("addressLine1")} placeholder="Building, street" />
              {errors.addressLine1 && <p className="text-xs text-rose-deep mt-1">{errors.addressLine1.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address line 2 (optional)</label>
              <input className={inputClass} {...register("addressLine2")} placeholder="Apartment, floor" />
            </div>
            <div>
              <label className={labelClass}>Area</label>
              <input className={inputClass} {...register("area")} placeholder="e.g. Jumeirah" />
              {errors.area && <p className="text-xs text-rose-deep mt-1">{errors.area.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Emirate</label>
              <input className={inputClass} {...register("emirate")} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Delivery instructions (optional)</label>
              <textarea className={inputClass} rows={2} {...register("deliveryInstructions")} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="serif text-xl mb-4">3. Delivery date & time</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" min={minDate} className={inputClass} {...register("deliveryDate")} />
              {errors.deliveryDate && <p className="text-xs text-rose-deep mt-1">{errors.deliveryDate.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Time slot</label>
              <select className={inputClass} {...register("deliverySlotId")}>
                <option value="">Select a slot</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.deliverySlotId && <p className="text-xs text-rose-deep mt-1">{errors.deliverySlotId.message}</p>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="serif text-xl mb-4">4. Coupon (optional)</h2>
          <input className={inputClass} {...register("couponCode")} placeholder="Enter coupon code" />
        </section>
      </div>

      <div className="bg-white/70 rounded-[22px] p-6 h-fit shadow-[0_18px_45px_-18px_rgba(101,72,80,.22)] sticky top-24">
        <h2 className="serif text-xl mb-4">Order summary</h2>
        <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
          {lines.map((l) => (
            <div key={l.productId} className="flex justify-between text-sm">
              <span className="text-ink-soft">
                {l.name} × {l.quantity}
              </span>
              <span>{formatMoney(l.unitPriceMinor * l.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm border-t border-ink/10 pt-3">
          <span className="text-ink-soft">Subtotal</span>
          <span>{formatMoney(subtotalMinor)}</span>
        </div>
        <p className="text-xs text-ink-soft mt-2 mb-4">
          Delivery fee, discount and tax are calculated and confirmed on the next step.
        </p>

        {serverError && <p className="text-sm text-rose-deep mb-3">{serverError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-7 py-3 rounded-full bg-rose-deep text-white text-sm tracking-wide hover:bg-ink transition-colors disabled:opacity-60"
        >
          {submitting ? "Processing…" : "Continue to payment"}
        </button>
        <p className="text-[.7rem] text-ink-soft mt-3 text-center">
          You&apos;ll be redirected to Ziina&apos;s secure payment page. We never see or store your card details.
        </p>
      </div>
    </form>
  );
}
