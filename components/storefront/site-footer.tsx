import Link from "next/link";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-ink text-[#F4EDE4] mt-24">
      <div className="container mx-auto w-[92%] max-w-[1180px] py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="serif text-2xl mb-3">Florinsta.ae</h3>
          <p className="text-sm text-[#cfc7bb] max-w-[32ch]">
            Luxury hand-tied bouquets and event florals, composed by hand in our Dubai atelier.
          </p>
        </div>

        <div>
          <h4 className="uppercase text-xs tracking-[.14em] text-gold mb-4">Shop</h4>
          <ul className="space-y-2 text-sm text-[#cfc7bb]">
            <li><Link href="/shop?category=bouquets" className="hover:text-white">Bouquets</Link></li>
            <li><Link href="/shop?category=baskets" className="hover:text-white">Baskets & arrangements</Link></li>
            <li><Link href="/events" className="hover:text-white">Weddings & events</Link></li>
            <li><Link href="/track-order" className="hover:text-white">Track an order</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="uppercase text-xs tracking-[.14em] text-gold mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-[#cfc7bb]">
            <li>
              <a href="https://wa.me/971568743084?text=Hello%20Florinsta!%20I%20have%20a%20question%20about%20my%20order."
                 className="hover:text-white">Order help (WhatsApp)</a>
            </li>
            <li><Link href="/policies/delivery" className="hover:text-white">Delivery policy</Link></li>
            <li><Link href="/policies/refunds" className="hover:text-white">Refund & cancellation policy</Link></li>
            <li><Link href="/policies/privacy" className="hover:text-white">Privacy policy</Link></li>
            <li><Link href="/policies/terms" className="hover:text-white">Terms & conditions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="uppercase text-xs tracking-[.14em] text-gold mb-4">We accept</h4>
          <div className="flex flex-wrap gap-3 text-sm text-[#cfc7bb]">
            <span>Ziina</span><span>Visa</span><span>Mastercard</span><span>Apple Pay</span><span>Tabby</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-[#9c9488]">
        © {new Date().getFullYear()} Florinsta.ae — All rights reserved.
      </div>
    </footer>
  );
}
