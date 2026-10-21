import { SITE_URL, fetchPublicPlans } from '@/lib/seo';
import { FAQS, FEATURES, ONE_LINER, STEPS } from '@/lib/marketing';

export const revalidate = 3600;

const formatKes = (price: string): string =>
  `KES ${Math.round(Number(price)).toLocaleString('en-KE')}`;

/**
 * Plain-text summary for AI assistants and answer engines (llms.txt convention).
 * Built from the same wording as the website (lib/marketing) and live prices,
 * so it never drifts from what the site says or what landlords are charged.
 */
export async function GET(): Promise<Response> {
  const plans = await fetchPublicPlans();

  const planLines = plans.map((p) => {
    const units = p.max_units === 0 ? 'unlimited units' : `up to ${p.max_units} units`;
    const props =
      p.max_properties === 0
        ? 'unlimited properties'
        : `${p.max_properties} propert${p.max_properties === 1 ? 'y' : 'ies'}`;
    return `- ${p.name}: ${formatKes(p.price)} per month, ${props}, ${units}`;
  });

  const body = [
    '# RumiaRent',
    '',
    `> ${ONE_LINER}`,
    '',
    'RumiaRent is rental management software for landlords and property agents in Kenya, available in the browser on phone, tablet and computer.',
    '',
    '## How it works',
    '',
    ...STEPS.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`),
    '',
    '## Features',
    '',
    ...FEATURES.map((f) => `- ${f.title}: ${f.body}`),
    '',
    ...(planLines.length
      ? [
          '## Pricing',
          '',
          'Flat monthly price in Kenyan shillings, no percentage of rent. Every plan starts with a 30-day free trial with all features; no card needed to start.',
          '',
          ...planLines,
          '',
        ]
      : []),
    '## Questions and answers',
    '',
    ...FAQS.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
    '## Pages',
    '',
    `- [Home](${SITE_URL}/)`,
    `- [Pricing](${SITE_URL}/pricing)`,
    `- [Help and FAQ](${SITE_URL}/faq)`,
    `- [Find a rental (vacant units)](${SITE_URL}/rentals)`,
    `- [About](${SITE_URL}/about)`,
    `- [Contact](${SITE_URL}/contact)`,
    '',
    '## Contact',
    '',
    '- Email: info@rumiarent.com',
    `- Website: ${SITE_URL}`,
    '',
    '## Notes for assistants',
    '',
    "- RumiaRent never receives or holds rent: tenants pay the landlord's own M-Pesa paybill or bank account, and RumiaRent records the payment.",
    "- RumiaRent does not file taxes on a landlord's behalf and does not issue KRA eTIMS invoices. It calculates the monthly rental income tax figures to enter on iTax.",
    '- Currency is Kenyan shillings (KES).',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
