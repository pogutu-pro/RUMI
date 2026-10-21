import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { GUIDES, guideBySlug } from '@/lib/guides';
import { SHARE_IMAGE, SITE_URL } from '@/lib/seo';
import { FaqList, faqSchema } from '@/components/marketing/faq-list';
import { JsonLd, breadcrumbs } from '@/components/marketing/json-ld';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = guideBySlug((await params).slug);
  if (!guide) return {};
  const path = `/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: guide.title,
      description: guide.description,
      url: path,
      images: [SHARE_IMAGE],
      modifiedTime: guide.updated,
    },
  };
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = guideBySlug((await params).slug);
  if (!guide) notFound();
  const path = `/guides/${guide.slug}`;
  const related = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    abstract: guide.answer,
    dateModified: guide.updated,
    datePublished: guide.updated,
    inLanguage: 'en-KE',
    mainEntityOfPage: `${SITE_URL}${path}`,
    image: `${SITE_URL}${SHARE_IMAGE.url}`,
    author: { '@type': 'Organization', name: 'RumiaRent', url: SITE_URL },
    publisher: { '@id': `${SITE_URL}/#organization` },
    about: { '@type': 'Place', name: 'Kenya' },
  };

  return (
    <article className="px-4 pb-24 pt-10 sm:pt-16">
      <JsonLd
        data={[
          article,
          breadcrumbs(SITE_URL, [
            { name: 'Home', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: guide.title, path },
          ]),
          ...(guide.faqs?.length ? [faqSchema(guide.faqs)] : []),
        ]}
      />
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <Link href="/guides" className="hover:text-gray-900">Guides</Link>
        </nav>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-[2.6rem]">
          {guide.title}
        </h1>
        <p className="mt-3 text-sm text-gray-500">Updated {formatDate(guide.updated)}</p>

        {/* The direct answer first: what search snippets and AI assistants quote. */}
        <div className="mt-8 rounded-xl border-l-4 border-primary bg-emerald-50/60 p-5">
          <p className="text-sm font-semibold text-gray-900">Short answer</p>
          <p className="mt-2 text-lg leading-relaxed text-gray-800">{guide.answer}</p>
        </div>

        <div className="mt-10 space-y-10">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{section.heading}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p.slice(0, 40)} className="mt-4 text-[17px] leading-relaxed text-gray-700">{p}</p>
              ))}
              {section.list &&
                (section.ordered ? (
                  <ol className="mt-4 list-decimal space-y-2 pl-6 text-[17px] leading-relaxed text-gray-700">
                    {section.list.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                ) : (
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-gray-700">
                    {section.list.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ))}
            </section>
          ))}
        </div>

        {guide.faqs && guide.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">Questions</h2>
            <FaqList items={guide.faqs} />
          </section>
        )}

        {guide.sources && guide.sources.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-gray-900">Sources</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {guide.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener" target="_blank" className="text-primary hover:underline">{s.label}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-14 rounded-2xl bg-[#033d2a] p-8 text-white">
          <h2 className="text-2xl font-semibold tracking-tight">Let RumiaRent do this for you</h2>
          <p className="mt-2 text-emerald-50/80">M-Pesa payments matched and receipted, reminders sent, statements ready. Free for 30 days.</p>
          <Link href={AUTH_ROUTES.REGISTER} className="mt-6 inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-[#033d2a] hover:bg-emerald-50">
            Start free
          </Link>
        </div>

        <nav aria-label="More guides" className="mt-14">
          <h2 className="text-lg font-semibold text-gray-900">More guides</h2>
          <ul className="mt-3 space-y-2">
            {related.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="text-primary hover:underline">{g.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </article>
  );
}
