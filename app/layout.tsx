import type { Metadata } from "next";
import { Fraunces, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ScrollReveal from "./_components/ScrollReveal";
import StoreHydration from "./_components/StoreHydration";

// Fraunces is the voice. Loading SOFT and WONK lets headlines be genuinely
// idiosyncratic — a "wonky" serif with soft terminals — rather than reading
// as the generic serif every AI landing page reaches for.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

// Archivo runs the interface: a warm grotesque with enough width to sit
// beside a display serif without going invisible the way Inter does.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

// Anything that behaves like data on a kitchen ticket — prices, order IDs,
// MCP tool names, timings — is set in mono. It is a semantic choice here,
// not decoration.
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SnapOrder — Snap a Photo, Get Your Food",
  description:
    "Photograph any dish. SnapOrder identifies it with Gemini vision, finds who cooks it nearest to you through Swiggy, and orders it — in about a minute.",
  keywords: [
    "food ordering",
    "AI food recognition",
    "photo to order",
    "food delivery",
    "snap order",
  ],
  openGraph: {
    title: "SnapOrder — Snap a Photo, Get Your Food",
    description:
      "Photograph any dish. We identify it, find who cooks it nearest to you, and order it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable} ${jetbrains.variable} antialiased`}
    >
      {/* Browser extensions inject attributes into <body> before hydration,
          which React would otherwise report as a mismatch. */}
      <body className="min-h-screen bg-paper text-ink" suppressHydrationWarning>
        <StoreHydration />
        {children}
        <ScrollReveal />
      </body>
    </html>
  );
}
