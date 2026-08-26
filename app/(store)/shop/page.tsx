import { getProductsByCategory, getCategories } from "@/lib/db/products";
import { ProductCard } from "@/components/product/product-card";
import Link from "next/link";

export const metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const [products, categories] = await Promise.all([
    getProductsByCategory(category),
    getCategories(),
  ]);

  const filtered = q
    ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    : products;

  return (
    <div className="container mx-auto w-[92%] max-w-[1180px] py-14">
      <span className="eyebrow">Shop</span>
      <h1 className="section-title text-[clamp(1.9rem,3.4vw,2.7rem)] mt-1 mb-8">
        {category ? categories.find((c) => c.slug === category)?.name ?? "Shop" : "All flowers"}
      </h1>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/shop"
          className={`px-4 py-1.5 rounded-full text-sm border ${!category ? "bg-ink text-white border-ink" : "border-ink/15"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            className={`px-4 py-1.5 rounded-full text-sm border ${category === c.slug ? "bg-ink text-white border-ink" : "border-ink/15"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-soft text-sm">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                slug: p.slug,
                name: p.name,
                mainImage: p.mainImage,
                priceMinor: p.priceMinor,
                currency: p.currency,
                isFeatured: p.isFeatured,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
