import { getActiveDeliverySlots } from "@/lib/db/delivery";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const slots = await getActiveDeliverySlots();

  return (
    <div className="container mx-auto w-[92%] max-w-[880px] py-14">
      <h1 className="section-title text-[clamp(1.9rem,3.4vw,2.7rem)] mb-8">Checkout</h1>
      <CheckoutForm
        slots={slots.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
