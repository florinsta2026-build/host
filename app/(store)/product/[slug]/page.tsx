import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getProductsByCategory } from "@/lib/db/products";
import { AddToCartForm } from "@/components/product/add-to-cart-form";
import { ProductCard } from "@/components/product/product-card";
import { formatMoney } from "@/lib/utils/money";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription ?? product.description,
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? product.description,
      images: [product.mainImage],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await getProductsByCategory(product.category.slug))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.mainImage,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: (product.priceMinor / 100).toFixed(2),
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container mx-auto w-[92%] max-w-[1180px] py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid md:grid-cols-2 gap-10">
        <div className="relative aspect-[4/5] rounded-[22px] overflow-hidden shadow-[0_18px_45px_-18px_rgba(101,72,80,.22)]">
          <Image src={product.mainImage} alt={product.name} fill priority className="object-cover" />
        </div>
        <div>
          <span className="eyebrow">{product.category.name}</span>
          <h1 className="text-[clamp(2rem,3.4vw,2.8rem)] mt-2">{product.name}</h1>
          <p className="mt-3 text-ink-soft">{product.description}</p>
          <p className="mt-4 serif text-2xl">{formatMoney(product.priceMinor, product.currency)}</p>

          <AddToCartForm
            productId={product.id}
            slug={product.slug}
            name={product.name}
            image={product.mainImage}
            priceMinor={product.priceMinor}
            currency={product.currency}
            optionGroups={product.options.map((g) => ({
              id: g.id,
              name: g.name,
              required: g.required,
              values: g.values.map((v) => ({
                id: v.id,
                label: v.label,
                priceDeltaMinor: v.priceDeltaMinor,
              })),
            }))}
          />
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="section-title text-[clamp(1.6rem,2.8vw,2.2rem)] mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => (
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
        </div>
      )}
    </div>
  );
}
