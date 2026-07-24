import type { Metadata } from "next";
import { Cormorant_Garamond, Cormorant, Jost } from "next/font/google";
import "./globals.css";
import StorefrontChrome from "@/components/layout/StorefrontChrome";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

// Cormorant (not Garamond) italic 500 — used for the logo wordmark
const cormorantLogo = Cormorant({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-cormorant-logo",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "700"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: "Veeral — Buy, Sell & Rent Indian Clothing",
  description:
    "A marketplace for South Asian fashion. Buy, sell, and rent lehengas, sarees, sherwanis, and more.",
  icons: { icon: "/icon.png" },
  openGraph: {
    title: "Veeral",
    description: "Buy, sell, and rent South Asian fashion.",
    siteName: "Veeral",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cormorantLogo.variable} ${jost.variable}`}>
      <body className="antialiased" style={{ fontFamily: "var(--font-jost), sans-serif" }}>
        <StorefrontChrome>{children}</StorefrontChrome>
      </body>
    </html>
  );
}
