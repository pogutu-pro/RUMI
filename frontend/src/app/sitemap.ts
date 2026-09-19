import type { MetadataRoute } from 'next';
import { PUBLIC_PAGES, SITE_URL, fetchBlogSlugs } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = PUBLIC_PAGES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? ('weekly' as const) : ('monthly' as const),
    priority,
  }));

  const posts = (await fetchBlogSlugs()).map(({ slug, updatedAt }) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...pages, ...posts];
}
