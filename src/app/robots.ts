import type { MetadataRoute } from 'next';
import { isIndexable, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    // Let crawlers read the noindex directives on private page shells.
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    ...(isIndexable ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
