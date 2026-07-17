import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://vaibhavijewels.in"),
  title: {
    default: "Vaibhavi Jewels | Fine Jewellery",
    template: "%s | Vaibhavi Jewels",
  },
  description:
    "Vaibhavi Jewels offers elegant gold, diamond, bridal, and everyday jewellery crafted for timeless celebrations.",
  icons: { icon: "/vaibhavi-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
