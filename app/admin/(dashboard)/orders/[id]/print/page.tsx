import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/db/admin-orders";

export default async function PackingSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const address = order.deliveryAddressSnapshot as {
    addressLine1: string; addressLine2?: string; area: string; city: string; emirate: string;
  };

  return (
    <div className="max-w-lg mx-auto p-10 font-sans text-black bg-white">
      <h1 className="text-2xl font-bold mb-1">Florinsta.ae</h1>
      <p className="text-sm mb-6">Packing slip — Order {order.orderNumber}</p>

      <div className="mb-6">
        <p className="font-semibold">Deliver to:</p>
        <p>{order.recipientName}</p>
        <p>{order.recipientPhone}</p>
        <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
        <p>{address.area}, {address.city}, {address.emirate}</p>
        <p className="mt-2">{new Date(order.deliveryDate).toLocaleDateString("en-AE")} — {order.deliveryTimeSlot?.name}</p>
      </div>

      <table className="w-full text-sm border-t border-black/20">
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-black/10">
              <td className="py-2">{item.productNameSnapshot}</td>
              <td className="py-2 text-right">× {item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.deliveryInstructions && <p className="mt-4 text-sm">Note: {order.deliveryInstructions}</p>}

      <script dangerouslySetInnerHTML={{ __html: `window.onload = () => window.print();` }} />
    </div>
  );
}
