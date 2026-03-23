import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "DynaUI — AI-assisted dynamic dashboards",
  description: "Infer UI from JSON APIs with rule engine + Claude layout hints.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: extensions (e.g. Grammarly) mutate <body> before React hydrates */}
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
