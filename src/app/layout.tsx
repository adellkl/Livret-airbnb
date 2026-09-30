import type { Metadata } from "next";
import "./globals.css";
import MobileHoverGuard from "@/components/layout/MobileHoverGuard";

import { isIndexable, siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Mon Livret — Livret d’accueil numérique', template: '%s | Mon Livret' },
  description: 'Créez et partagez un livret d’accueil numérique pour votre location saisonnière avec Mon Livret.',
  applicationName: 'Mon Livret',
  robots: { index: isIndexable, follow: true },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
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
