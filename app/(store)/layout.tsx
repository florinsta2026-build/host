import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { WhatsAppFloat } from "@/components/storefront/whatsapp-float";
import { CartProvider } from "@/components/cart/cart-provider";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppFloat message="Hello Florinsta! I'd love to enquire about your flowers." />
    </CartProvider>
  );
}
