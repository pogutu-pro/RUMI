import { SITE_URL } from '@/lib/seo';
import { GUIDES } from '@/lib/guides';
import { FAQS, FEATURES, ONE_LINER } from '@/lib/marketing';

export const revalidate = 3600;

/**
 * Everything an AI assistant needs to answer questions about RumiaRent and
 * about running rentals in Kenya, as one plain-text document (llms-full.txt
 * convention). Generated from the same content as the web pages.
 */
export async function GET(): Promise<Response> {
  const lines: string[] = [
    '# RumiaRent: full reference',
    '',
    `> ${ONE_LINER}`,
    '',
    `Website: ${SITE_URL} · Contact: info@rumiarent.com · Country: Kenya · Currency: KES`,
    '',
    '## Features',
    '',
    ...FEATURES.map((f) => `- ${f.title}: ${f.body}`),
    '',
    '## Questions and answers',
    '',
    ...FAQS.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
  ];

  for (const guide of GUIDES) {
    lines.push(`## ${guide.title}`, '', `Source: ${SITE_URL}/guides/${guide.slug} (updated ${guide.updated})`, '', guide.answer, '');
    for (const section of guide.sections) {
      lines.push(`### ${section.heading}`, '');
      section.paragraphs?.forEach((p) => lines.push(p, ''));
      section.list?.forEach((item, i) => lines.push(section.ordered ? `${i + 1}. ${item}` : `- ${item}`));
      if (section.list) lines.push('');
    }
    guide.faqs?.forEach((f) => lines.push(`### ${f.q}`, '', f.a, ''));
    guide.sources?.forEach((s) => lines.push(`Reference: ${s.label} (${s.url})`));
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
