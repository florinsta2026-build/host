import { prisma } from "@/lib/db/prisma";
import { InventoryAdjustControl } from "@/components/admin/inventory-adjust-control";

export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    include: { product: { select: { id: true, name: true, sku: true } } },
    orderBy: { quantity: "asc" },
  });

  return (
    <div>
      <h1 className="serif text-2xl mb-6">Inventory</h1>
      <div className="bg-white rounded-2xl border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-soft border-b border-ink/10">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">On hand</th>
              <th className="px-4 py-3">Reserved</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Low stock threshold</th>
              <th className="px-4 py-3">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const available = i.quantity - i.reservedQuantity;
              const low = available <= i.lowStockThreshold;
              return (
                <tr key={i.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-medium">{i.product.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{i.product.sku}</td>
                  <td className="px-4 py-3">{i.quantity}</td>
                  <td className="px-4 py-3">{i.reservedQuantity}</td>
                  <td className={`px-4 py-3 font-medium ${low ? "text-rose-deep" : ""}`}>{available}</td>
                  <td className="px-4 py-3 text-ink-soft">{i.lowStockThreshold}</td>
                  <td className="px-4 py-3"><InventoryAdjustControl productId={i.product.id} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
