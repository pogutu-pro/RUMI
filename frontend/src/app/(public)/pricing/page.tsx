import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Landmark, Receipt, MessageCircle, Headset } from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { PricingContent } from './_components/pricing-content';
import { SITE_URL, fetchPublicPlans } from '@/lib/seo';

export const metadata: Metadata = {
  alternates: { canonical: '/pricing' },
  title: 'Pricing',
  description: 'RumiaRent rental management pricing. Simple, flat monthly billing.',
};

const PRICING_HIGHLIGHTS = [
  { icon: Landmark, label: 'Bank, M-Pesa, and card payments' },
  { icon: Receipt, label: 'Automated invoicing and billing' },
  { icon: MessageCircle, label: 'Built-in communication module' },
  { icon: Headset, label: 'Dedicated customer support' },
];

export default async function PricingPage() {
  const plans = await fetchPublicPlans();
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RumiaRent',
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS',
    description:
      'Rental management platform for Kenyan landlords and agents: properties, tenants, rent collection, reminders and simple accounting.',
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: Number(plan.price).toFixed(2),
      priceCurrency: 'KES',
      url: `${SITE_URL}/pricing`,
      availability: 'https://schema.org/InStock',
    })),
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {plans.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
        />
      )}
      {/* Header */}
      <section className="bg-white py-24 px-4 relative overflow-hidden border-b border-gray-100">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-primary mb-6">
            Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Flat monthly pricing, from Starter to Enterprise. No per-unit surprises.
            Notifications included.
          </p>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-4 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trial Notice */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="border border-gray-100 bg-gray-50 p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-bold text-primary text-3xl mb-2">30-day free trial</h3>
              <p className="text-lg text-gray-600">
                New landlords get a 30-day trial with full Enterprise-tier access. No credit card required.
              </p>
            </div>
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button className="rounded-full px-10 h-14 text-lg font-medium">
                Start Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PricingContent />
      <p className="mx-auto max-w-3xl px-4 pb-16 text-center text-sm text-gray-500">
        Plans renew monthly until cancelled, and you keep access until the end of the month you
        have paid for. Cancelling and refunds are covered in our{' '}
        <Link href="/terms" className="text-primary underline underline-offset-4">
          Terms of Service
        </Link>
        .
      </p>

      {/* Billing Details */}
      <section className="pb-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notifications</p>
                <p className="text-sm text-gray-600">Rent-due reminders and payment confirmations included.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billing Model</p>
                <p className="text-sm text-gray-600">Billed monthly per selected plan: flat pricing, no per-unit metering.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Multiple properties</p>
                <p className="text-sm text-gray-600">Manage as many properties as your plan allows on one account.</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/contact" className="text-sm font-semibold text-gray-900 underline underline-offset-4">
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Legal */}
      <footer className="py-8 border-t border-gray-100 text-center px-4">
        <p className="text-xs text-gray-500">
          Prices exclude VAT where applicable. <Link href="/terms" className="underline">Terms and service apply</Link>.
        </p>
      </footer>
    </div>
  );
}
