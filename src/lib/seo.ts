import type { Metadata } from 'next';

const configuredUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://monlivret.eu');
if (!['http:', 'https:'].includes(configuredUrl.protocol) || configuredUrl.username || configuredUrl.password) {
  throw new Error('NEXT_PUBLIC_APP_URL doit être une URL publique HTTP(S), sans identifiants.');
}
export const siteUrl = configuredUrl.origin;
export const isIndexable = process.env.SEO_INDEXABLE !== 'false'
  && (process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production');

export const publicPages = [
  { path: '/', title: 'Livret d’accueil numérique pour locations saisonnières', description: 'Créez un livret d’accueil numérique pour votre location saisonnière. Partagez accès, Wi-Fi et bonnes adresses par lien ou QR code avec Mon Livret.' },
  { path: '/fonctionnalites', title: 'Fonctionnalités du livret d’accueil digital', description: 'Personnalisez votre livret d’accueil : arrivée, Wi-Fi, équipements, bonnes adresses, messagerie et accès par séjour. Découvrez Mon Livret.' },
  { path: '/tarifs', title: 'Tarifs pour propriétaires et conciergeries', description: 'Comparez les offres Gratuit, Pro et Business de Mon Livret pour gérer vos livrets d’accueil numériques, d’un logement à une conciergerie.' },
  { path: '/mentions-legales', title: 'Mentions légales', description: 'Consultez les mentions légales et les informations relatives au site Mon Livret, service de livrets d’accueil numériques.' },
  { path: '/confidentialite', title: 'Politique de confidentialité', description: 'Découvrez les informations sur le traitement des données personnelles et vos droits lors de l’utilisation de Mon Livret.' },
  { path: '/conditions-utilisation', title: 'Conditions d’utilisation', description: 'Consultez les conditions d’utilisation de Mon Livret pour la création et le partage de livrets d’accueil numériques.' },
] as const;

export const privateMetadata: Metadata = {
  title: { absolute: 'Espace privé | Mon Livret' },
  robots: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
};

export function pageMetadata(path: string): Metadata {
  const page = publicPages.find((entry) => entry.path === path);
  if (!page) throw new Error(`Page SEO inconnue : ${path}`);
  const title = `${page.title} | Mon Livret`;
  return {
    title: { absolute: title },
    description: page.description,
    alternates: { canonical: `${siteUrl}${page.path}` },
    robots: { index: isIndexable, follow: true },
    openGraph: {
      type: 'website', locale: 'fr_FR', siteName: 'Mon Livret',
      url: `${siteUrl}${page.path}`, title, description: page.description,
      images: [{ url: '/og.png', width: 1730, height: 909, alt: 'Mon Livret — Livret d’accueil numérique' }],
    },
    twitter: { card: 'summary_large_image', title, description: page.description, images: ['/og.png'] },
  };
}

export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Mon Livret', url: siteUrl, logo: `${siteUrl}/icon.png` },
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'Mon Livret', url: siteUrl, inLanguage: 'fr-FR', publisher: { '@id': `${siteUrl}/#organization` } },
    { '@type': 'WebApplication', '@id': `${siteUrl}/#application`, name: 'Mon Livret', url: siteUrl, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'fr', description: publicPages[0].description, publisher: { '@id': `${siteUrl}/#organization` } },
  ],
};
