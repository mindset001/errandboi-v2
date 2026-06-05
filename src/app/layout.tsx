import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Errandboi — Fast & Reliable Logistics",
  description:
    "Book a ride, send a package, or let Errandboi handle your market shopping. Fast pickups, real-time tracking.",
  keywords: ["logistics", "ride hailing", "delivery", "market errand", "Lagos"],
  openGraph: {
    title: "Errandboi",
    description: "Your city, delivered instantly.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">{children}</body>
    </html>
  );
}
