import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/utils/money";

type CardProduct = {
  slug: string;
  name: string;
  mainImage: string;
  priceMinor: number;
  currency: string;
  isFeatured: boolean;
};

export function ProductCard({ product }: { product: CardProduct }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-[22px] bg-white/70 shadow-[0_18px_45px_-18px_rgba(101,72,80,.22)] overflow-hidden hover:-translate-y-1 transition-transform"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-blush-soft">
        <Image
          src={product.mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.isFeatured && (
          <span className="absolute top-3 left-3 bg-gold text-white text-[.65rem] uppercase tracking-wider px-2.5 py-1 rounded-full">
            Grand format
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="serif text-lg leading-snug">{product.name}</h3>
        <p className="mt-1 text-[.85rem] text-ink-soft">
          {/* Zero price = quoted item (event work), never "from AED 0" */}
          {product.priceMinor === 0
            ? "Contact for quote"
            : `from ${formatMoney(product.priceMinor, product.currency)}`}
        </p>
      </div>
    </Link>
  );
}
