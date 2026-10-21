import Link from 'next/link';
import { Check } from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { SITE_URL } from '@/lib/seo';
import { GUIDES } from '@/lib/guides';
import { FaqList, faqSchema } from '@/components/marketing/faq-list';
import { JsonLd, breadcrumbs } from '@/components/marketing/json-ld';

export interface AudienceContent {
  path: string;
  name: string;
  title: string;
  intro: string;
  points: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  guides: string[];
}

/** One page per audience: who it is for, what changes for them, their questions. */
export function AudiencePage({ content }: { content: AudienceContent }) {
  const guides = GUIDES.filter((g) => content.guides.includes(g.slug));
  return (
    <section className="px-4 pb-24 pt-12 sm:pt-20">
      <JsonLd
        data={[
          breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: content.name, path: content.path }]),
          faqSchema(content.faqs),
        ]}
      />
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">{content.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">{content.intro}</p>
          <Link href={AUTH_ROUTES.REGISTER} className="mt-8 inline-flex h-12 items-center rounded-lg bg-primary px-6 text-base font-semibold text-white hover:bg-primary/90">
            Start free for 30 days
          </Link>
        </div>

        <ul className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {content.points.map((point) => (
            <li key={point.title} className="flex gap-3">
              <Check className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{point.title}</h2>
                <p className="mt-1 leading-relaxed text-gray-600">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-20 grid gap-10 lg:grid-cols-3">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Questions</h2>
          <div className="lg:col-span-2">
            <FaqList items={content.faqs} />
          </div>
        </div>

        {guides.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-semibold text-gray-900">Guides</h2>
            <ul className="mt-3 space-y-2">
              {guides.map((g) => (
                <li key={g.slug}><Link href={`/guides/${g.slug}`} className="text-primary hover:underline">{g.title}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
