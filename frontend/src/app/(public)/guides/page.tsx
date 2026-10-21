import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { GUIDES } from '@/lib/guides';
import { SITE_URL } from '@/lib/seo';
import { PageIntro } from '@/components/marketing/page-intro';
import { JsonLd, breadcrumbs } from '@/components/marketing/json-ld';

export const metadata: Metadata = {
  title: 'Guides for Kenyan landlords',
  description:
    'Plain guides for landlords and agents in Kenya: collecting rent with M-Pesa, rental income tax (MRI), receipts, late rent, deposits and choosing rental software.',
  alternates: { canonical: '/guides' },
};

export default function GuidesPage() {
  return (
    <section className="px-4 pb-24 pt-12 sm:pt-20">
      <JsonLd
        data={[
          breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' }]),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: GUIDES.map((g, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${SITE_URL}/guides/${g.slug}`,
              name: g.title,
            })),
          },
        ]}
      />
      <div className="mx-auto max-w-6xl">
        <PageIntro title="Guides for Kenyan landlords">
          Short, practical answers on rent, M-Pesa, tax and tenants.
        </PageIntro>
        <ul className="mt-12 grid gap-4 md:grid-cols-2">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="group flex h-full flex-col rounded-xl border border-gray-200 p-6 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <h2 className="text-lg font-semibold text-gray-900">{guide.title}</h2>
                <p className="mt-2 flex-1 text-gray-600">{guide.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
