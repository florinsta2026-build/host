import Image from "next/image";
import Link from "next/link";
import { getFeaturedProducts, getCategories } from "@/lib/db/products";
import { ProductCard } from "@/components/product/product-card";

export const revalidate = 60;

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ]);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto w-[92%] max-w-[1180px] py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="eyebrow">Luxury Florist · Dubai</span>
            <h1 className="text-[clamp(2.4rem,5vw,3.6rem)] mt-3">
              Flowers, composed <em className="italic">by hand</em> in our Dubai atelier
            </h1>
            <p className="mt-4 text-ink-soft max-w-[46ch]">
              Hand-tied luxury bouquets and event florals, delivered same-day across Dubai.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center px-7 py-3 rounded-full bg-rose-deep text-white text-sm tracking-wide hover:bg-ink transition-colors"
              >
                Shop the collection
              </Link>
              <a
                href="https://wa.me/971568743084?text=Hello%20Florinsta!%20I'd%20love%20to%20enquire%20about%20your%20flowers."
                className="inline-flex items-center px-7 py-3 rounded-full border border-ink/15 text-sm tracking-wide hover:bg-white transition-colors"
              >
                WhatsApp us
              </a>
            </div>
            <p className="mt-6 text-xs text-ink-soft">✦ Free delivery on orders over AED 300</p>
          </div>
          <div className="relative aspect-[4/5] rounded-[22px] overflow-hidden shadow-[0_18px_45px_-18px_rgba(101,72,80,.22)]">
            <Image src="/assets/img/x49.webp" alt="Florinsta luxury bouquet" fill priority className="object-cover" />
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="categories" className="container mx-auto w-[92%] max-w-[1180px] py-14">
        <span className="eyebrow">Collections</span>
        <h2 className="section-title text-[clamp(1.9rem,3.4vw,2.7rem)] mt-1 mb-8">Shop by category</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="relative rounded-[22px] overflow-hidden aspect-[16/9] bg-sage flex items-end p-6 group"
            >
              {c.image && (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h3 className="relative serif text-2xl text-white">{c.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured products ── */}
      <section id="shop" className="container mx-auto w-[92%] max-w-[1180px] py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="eyebrow">The Edit</span>
            <h2 className="section-title text-[clamp(1.9rem,3.4vw,2.7rem)] mt-1">Featured bouquets & baskets</h2>
          </div>
          <Link href="/shop" className="text-sm text-rose-deep hover:underline hidden sm:block">
            View all →
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-ink-soft text-sm">
            No products yet — run <code>npm run seed</code> once <code>DATABASE_URL</code> is configured.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p) => (
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
      </section>

      {/* ── Trust / payment strip ── */}
      <section className="bg-blush-soft py-14">
        <div className="container mx-auto w-[92%] max-w-[1180px] grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="serif text-xl">Same-day delivery</h3>
            <p className="text-sm text-ink-soft mt-1">Order before the daily cutoff for delivery across Dubai today.</p>
          </div>
          <div>
            <h3 className="serif text-xl">Split in 4, interest-free</h3>
            <p className="text-sm text-ink-soft mt-1">Pay with Ziina, or split any order into 4 payments with Tabby.</p>
          </div>
          <div>
            <h3 className="serif text-xl">Hand-tied in our atelier</h3>
            <p className="text-sm text-ink-soft mt-1">Composed fresh, same morning, by our Dubai florists.</p>
          </div>
        </div>
      </section>
    </>
  );
}
