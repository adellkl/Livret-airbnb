import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://livret-airbnb-five.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Livret d’accueil — Un accueil mémorable",
  description:
    "Créez un livret d’accueil digital élégant et pratique pour offrir une expérience mémorable à vos voyageurs.",
  openGraph: {
    title: "Un accueil mémorable, avant même l’arrivée.",
    description: "Le livret d’accueil digital pensé pour les hôtes attentionnés.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Livret d’accueil digital" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Un accueil mémorable, avant même l’arrivée.",
    description: "Le livret d’accueil digital pensé pour les hôtes attentionnés.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
