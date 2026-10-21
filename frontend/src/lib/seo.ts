import { getApiUrl } from '@/lib/utils/env';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://rumiarent.com'
).replace(/\/$/, '');

export const SITE_NAME = 'RumiaRent';
export const SOCIAL_HANDLE = '@rumiarentplatform';
export const SHARE_IMAGE = {
  url: '/images/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'RumiaRent: rental management for Kenyan landlords and agents',
  type: 'image/jpeg',
} as const;

/** Public pages that belong in the sitemap, with their relative importance. */
export const PUBLIC_PAGES: ReadonlyArray<{ path: string; priority: number }> = [
  { path: '/', priority: 1 },
  { path: '/pricing', priority: 0.9 },
  { path: '/faq', priority: 0.8 },
  { path: '/rentals', priority: 0.8 },
  { path: '/for/landlords', priority: 0.8 },
  { path: '/for/agents', priority: 0.8 },
  { path: '/guides', priority: 0.8 },
  { path: '/guides/collect-rent-with-mpesa', priority: 0.7 },
  { path: '/guides/rental-income-tax-kenya', priority: 0.7 },
  { path: '/guides/rent-receipts-kenya', priority: 0.7 },
  { path: '/guides/choosing-rental-management-software-kenya', priority: 0.7 },
  { path: '/guides/late-rent-kenya', priority: 0.7 },
  { path: '/guides/tenant-deposits-kenya', priority: 0.7 },
  { path: '/about', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
  { path: '/blog', priority: 0.6 },
  { path: '/careers', priority: 0.4 },
  { path: '/privacy', priority: 0.4 },
  { path: '/terms', priority: 0.4 },
  { path: '/cookies', priority: 0.3 },
  { path: '/compliance', priority: 0.3 },
];

export interface PublicPlan {
  name: string;
  slug: string;
  price: string;
  interval: string;
  max_properties: number;
  max_units: number;
  max_caretaker_seats?: number;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${getApiUrl()}${path}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Live plans, or an empty list when the API is unreachable at build/render time. */
export async function fetchPublicPlans(): Promise<PublicPlan[]> {
  const plans = await fetchJson<PublicPlan[]>('/billing/plans/');
  return Array.isArray(plans) ? plans : [];
}

export async function fetchBlogSlugs(): Promise<
  Array<{ slug: string; updatedAt?: string }>
> {
  const data = await fetchJson<{
    posts?: Array<{ slug: string; updated_at?: string; published_at?: string }>;
  }>('/home/blog/?limit=100');
  return (data?.posts ?? []).map((p) => ({
    slug: p.slug,
    updatedAt: p.updated_at || p.published_at,
  }));
}

export function canonical(path: string): { canonical: string } {
  return { canonical: path };
}
