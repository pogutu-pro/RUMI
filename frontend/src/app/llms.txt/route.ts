import { SITE_URL, fetchPublicPlans } from '@/lib/seo';

export const revalidate = 3600;

const formatKes = (price: string): string =>
  `KES ${Math.round(Number(price)).toLocaleString('en-KE')}`;

/**
 * Plain-text summary for AI assistants and answer engines (llms.txt convention).
 * Pricing is read live so it never drifts from what landlords are charged.
 */
export async function GET(): Promise<Response> {
  const plans = await fetchPublicPlans();

  const planLines = plans.map((p) => {
    const units =
      p.max_units === 0 ? 'unlimited units' : `up to ${p.max_units} units`;
    const props =
      p.max_properties === 0
        ? 'unlimited properties'
        : `${p.max_properties} propert${p.max_properties === 1 ? 'y' : 'ies'}`;
    return `- ${p.name}: ${formatKes(p.price)} per month, ${props}, ${units}`;
  });

  const body = [
    '# RumiaRent',
    '',
    '> RumiaRent is a rental management platform for Kenyan landlords and property agents. It handles properties, units, tenants, rent charges, rent collection through Paystack and manual cash, bank or M-Pesa records, SMS and email reminders, tenant and caretaker chat, and simple accounting with monthly rental income tax (MRI) figures.',
    '',
    '## What it does',
    '',
    '- Organise properties into units and attach tenants with rent, deposit and due day.',
    '- Generate rent charges automatically and show who owes what in real time.',
    '- Collect rent online with Paystack, or record cash, bank and M-Pesa payments.',
    '- Send rent reminders by SMS and email.',
    '- Give caretakers access to only the properties they look after.',
    '- Work out monthly rental income tax (MRI, 7.5% of gross rent, due by the 20th) and export transactions to QuickBooks-compatible CSV.',
    '- Tenants are added by their landlord or caretaker; they do not self-register.',
    '',
    '## Who it is for',
    '',
    '- Landlords and property agents in Kenya managing one or many rental properties.',
    "- Caretakers who collect rent and handle tenants on a landlord's behalf.",
    '- Tenants who want to see their balance and pay rent from their phone.',
    '',
    ...(planLines.length
      ? [
          '## Pricing',
          '',
          'Every plan starts with a 30-day free trial. Rental income tax figures and accounting are free on every plan.',
          '',
          ...planLines,
          '',
        ]
      : []),
    '## Pages',
    '',
    `- [Home](${SITE_URL}/)`,
    `- [Features](${SITE_URL}/features)`,
    `- [Pricing](${SITE_URL}/pricing)`,
    `- [How it works](${SITE_URL}/how-it-works)`,
    `- [FAQ](${SITE_URL}/faq)`,
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
    '- Payments are processed by Paystack; RumiaRent does not store card numbers.',
    "- RumiaRent does not file taxes on a landlord's behalf and does not issue KRA eTIMS invoices. It calculates the figures to enter on iTax.",
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
