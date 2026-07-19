import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cabinet FB — Gestion",
  description: "Gestion de cabinet médical (neurologie)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className="h-full scroll-smooth"
    >
      <body suppressHydrationWarning className="min-h-full font-sans text-cabinet-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
