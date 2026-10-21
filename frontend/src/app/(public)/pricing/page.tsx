import Link from 'next/link';
import type { Metadata } from 'next';
import { SHARE_IMAGE, SITE_URL, fetchPublicPlans } from '@/lib/seo';
import { PlanCards } from '@/components/marketing/plan-cards';
import { FaqList, faqSchema } from '@/components/marketing/faq-list';

export const revalidate = 3600;

const DESCRIPTION =
  'RumiaRent pricing in Kenyan shillings: one flat monthly price by how many properties and units you manage. 30-day free trial, no card needed.';

export const metadata: Metadata = {
  title: 'Pricing',
  description: DESCRIPTION,
  alternates: { canonical: '/pricing' },
  openGraph: { title: 'RumiaRent pricing', description: DESCRIPTION, url: '/pricing', images: [SHARE_IMAGE] },
};

const PRICING_FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes. Every new account gets 30 days with every feature unlocked. No card is needed to start, and nothing is charged until you choose a plan.',
  },
  {
    q: 'Do you charge a percentage of rent?',
    a: 'No. You pay one flat monthly price. Rent goes straight from your tenants to your own paybill or bank account, and RumiaRent takes nothing from it.',
  },
  {
    q: 'Are SMS receipts and reminders included?',
    a: 'Yes. Receipts, rent reminders and arrears notices by SMS and email are included in every plan.',
  },
  {
    q: 'How do I pay for RumiaRent?',
    a: 'By card through Paystack, renewing monthly. If you do not have a card, choose "Pay another way" when subscribing and pay by M-Pesa or bank; your plan starts once the payment is confirmed.',
  },
  {
    q: 'Can I change or cancel my plan?',
    a: 'Yes, at any time from Billing. You keep access until the end of the month you have paid for.',
  },
];

export default async function PricingPage() {
  const plans = await fetchPublicPlans();
  const offers = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RumiaRent',
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web browser',
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: Number(plan.price).toFixed(2),
      priceCurrency: 'KES',
      url: `${SITE_URL}/pricing`,
    })),
  };

  return (
    <>
      {plans.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offers) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(PRICING_FAQS)) }} />

      <section className="px-4 pb-16 pt-12 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">Pricing</h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              One flat monthly price, chosen by how much you manage. No percentage of your rent, no setup fee.
              Every plan starts with 30 days free.
            </p>
          </div>
          <div className="mt-12">
            <PlanCards plans={plans} />
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Prices in Kenyan shillings per month. Managing more than the largest plan, or several agencies?{' '}
            <Link href="/contact" className="font-medium text-primary hover:underline">Talk to us</Link>.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50/60 px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Pricing questions</h2>
          <div className="lg:col-span-2">
            <FaqList items={PRICING_FAQS} />
          </div>
        </div>
      </section>
    </>
  );
}
