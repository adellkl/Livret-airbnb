import type { MetadataRoute } from 'next';
import { isIndexable, publicPages, siteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return isIndexable ? publicPages.map((page) => ({ url: `${siteUrl}${page.path}` })) : [];
}
