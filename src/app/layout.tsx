import type { Metadata } from "next";
import "./globals.css";
import MobileHoverGuard from "@/components/layout/MobileHoverGuard";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://monlivret.eu");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Mon Livret — Un accueil mémorable",
  description:
    "Mon Livret vous aide à créer un guide digital élégant et pratique pour offrir une expérience mémorable à vos voyageurs.",
  openGraph: {
    title: "Mon Livret — Un accueil mémorable, avant même l’arrivée.",
    description: "Le guide digital pensé pour les hôtes attentionnés.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mon Livret, guide digital" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mon Livret — Un accueil mémorable, avant même l’arrivée.",
    description: "Le guide digital pensé pour les hôtes attentionnés.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <MobileHoverGuard />
        {children}
      </body>
    </html>
  );
}
