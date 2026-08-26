import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { ProductRowControls } from "@/components/admin/product-row-controls";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, inventory: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="serif text-2xl">Products</h1>
        <p className="text-sm text-ink-soft">{products.length} products</p>
      </div>

      <div className="bg-white rounded-2xl border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-soft border-b border-ink/10">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Price / status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-blush-soft shrink-0">
                      <Image src={p.mainImage} alt={p.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-ink-soft">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-soft">{p.category.name}</td>
                <td className="px-4 py-3">
                  {p.inventory ? (
                    <span className={p.inventory.quantity - p.inventory.reservedQuantity <= p.inventory.lowStockThreshold ? "text-rose-deep font-medium" : ""}>
                      {p.inventory.quantity - p.inventory.reservedQuantity} available
                    </span>
                  ) : (
                    <span className="text-ink-soft">Not tracked</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ProductRowControls
                    productId={p.id}
                    isAvailable={p.isAvailable}
                    isFeatured={p.isFeatured}
                    priceMinor={p.priceMinor}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
