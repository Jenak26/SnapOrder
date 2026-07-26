import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display face for headlines only. Geist alone reads as stock
// create-next-app; the serif/sans pairing gives the page a voice.
const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "SnapOrder — Snap a Photo, Get Your Food",
  description:
    "Upload any food photo and instantly order the closest matching dish from top restaurants near you. AI-powered food recognition meets instant delivery.",
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
      "Upload any food photo and instantly order the closest matching dish.",
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      {/* Browser extensions inject attributes into <body> before hydration,
          which React would otherwise report as a mismatch. */}
      <body
        className="min-h-screen bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
