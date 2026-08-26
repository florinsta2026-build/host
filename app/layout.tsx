import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/admin/session-provider";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://florinstauae.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Florinsta.ae — Behind the Flowers | Luxury Florist Dubai",
    template: "%s | Florinsta.ae",
  },
  description:
    "Florinsta — luxury hand-tied bouquets and event florals, same-day delivery across Dubai. Pay with Ziina, Tabby.",
  openGraph: {
    title: "Florinsta.ae — Luxury Flowers, Dubai",
    description:
      "Hand-tied luxury bouquets and event florals with same-day delivery across Dubai.",
    type: "website",
    images: ["/assets/img/x49.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
