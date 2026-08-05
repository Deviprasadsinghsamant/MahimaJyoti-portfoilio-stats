import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { PortfolioHeader, PortfolioFooter } from "@/components/layout/PortfolioChrome";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MahimaJyoti — Excellence in Education",
    template: "%s | MahimaJyoti",
  },
  description:
    "A premier educational institution offering Primary (BSE), Intermediate (CHSE), and Graduation (Utkal University) programs. Nurturing minds, shaping futures since establishment.",
  keywords: [
    "school",
    "education",
    "BSE board",
    "CHSE board",
    "Utkal University",
    "primary education",
    "intermediate",
    "graduation",
    "Odisha",
  ],
  authors: [{ name: "MahimaJyoti" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "MahimaJyoti",
    title: "MahimaJyoti — Excellence in Education",
    description:
      "A premier educational institution offering Primary, Intermediate, and Graduation programs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${playfair.variable} ${inter.variable} font-body antialiased`}
      >
        <PortfolioHeader />
        <main className="min-h-screen">{children}</main>
        <PortfolioFooter />
      </body>
    </html>
  );
}
