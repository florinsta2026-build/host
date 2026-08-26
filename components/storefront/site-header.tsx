import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/cart/cart-badge";

const NAV_LINKS = [
  { href: "/shop?category=bouquets", label: "Bouquets" },
  { href: "/events", label: "Events" },
  { href: "/shop", label: "Collections" },
  { href: "/#journal", label: "Journal" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <>
      <div className="bg-ink text-[#F4EDE4] text-[.72rem] tracking-[.14em] uppercase overflow-hidden whitespace-nowrap">
        <div className="inline-flex gap-[3.2rem] py-2 animate-marquee">
          <span>✦ Same-day delivery across Dubai</span>
          <span>✦ Free delivery on orders over AED 300</span>
          <span>✦ Hand-tied in our Dubai atelier</span>
          <span>✦ Same-day delivery across Dubai</span>
          <span>✦ Free delivery on orders over AED 300</span>
          <span>✦ Hand-tied in our Dubai atelier</span>
        </div>
      </div>

      <nav className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-black/5">
        <div className="container mx-auto w-[92%] max-w-[1180px] flex items-center justify-between py-4">
          <Link href="/" aria-label="Florinsta home" className="shrink-0">
            <Image
              src="/assets/img/logo1.webp"
              alt="Florinsta.ae — Behind the Flowers"
              width={260}
              height={34}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <div className="hidden md:flex gap-8 text-[.82rem] tracking-[.12em] uppercase font-medium text-ink-soft">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-rose-deep transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              aria-label="Open cart"
              className="relative p-2 rounded-full hover:bg-blush transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-5 h-5">
                <path d="M6 7h12l1.3 12.2a1.5 1.5 0 0 1-1.5 1.8H6.2a1.5 1.5 0 0 1-1.5-1.8L6 7z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
              <CartBadge />
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
