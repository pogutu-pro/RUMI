import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Rumia rental management pricing. Simple, per-unit monthly billing.',
};

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  cta: string;
  ctaLink: string;
  footerNote: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 50,
    features: [
      'Properties, units & tenants',
      'Automatic rent charges',
      'Outstanding & overdue tracking',
      'Cash & bank payment recording',
    ],
    cta: 'Start Starter',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=starter`,
    footerNote: 'Everything a landlord needs to start.',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 80,
    features: [
      'Everything in Starter',
      'Paystack rent collection',
      'Caretaker accounts, scoped by property',
      'Rent-due & payment notifications',
    ],
    cta: 'Start Growth',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=growth`,
    footerNote: 'For landlords who want tenants paying online.',
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 150,
    features: [
      'Everything in Growth',
      'Multiple landlords/organizations',
      'Priority support',
      'Compliance-ready financial exports',
    ],
    cta: 'Apply for Agency',
    ctaLink: '/contact?subject=Agency%20Application',
    footerNote: 'For agents managing properties on behalf of others.',
  },
];

const FAQS = [
  {
    q: 'Does the price include notifications?',
    a: 'Yes. Rent-due reminders and payment confirmations are included, with no separate messaging fees.',
  },
  {
    q: 'What does "per unit" mean?',
    a: 'You\'re billed per occupied rental unit: an apartment, house, or room you manage, not per property.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes. Upgrade or downgrade from your dashboard at any time; billing adjusts on your next invoice.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <section className="bg-white py-24 px-4 relative overflow-hidden border-b border-gray-100">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-primary mb-6">
            Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Per-unit monthly billing, from KES 50 to 150 per occupied unit per month.
            Notifications included.
          </p>
        </div>
      </section>

      {/* Trial Notice */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="border border-gray-100 bg-gray-50 p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-bold text-primary text-3xl mb-2">30-day free trial</h3>
              <p className="text-lg text-gray-600">Full access to Starter and Growth. No credit card required.</p>
            </div>
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button className="rounded-full px-10 h-14 text-lg font-medium">
                Start Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl p-10 transition-all relative overflow-hidden ${
                  plan.id === 'growth'
                    ? 'border-2 border-primary shadow-xl lg:scale-105 z-10 bg-white'
                    : 'border border-gray-100 shadow-sm bg-gray-50/50'
                }`}
              >
                {plan.id === 'growth' && (
                  <div className="absolute top-6 right-6 bg-primary text-white px-4 py-1 rounded-full font-semibold text-xs tracking-wide">
                    POPULAR
                  </div>
                )}
                <div className="mb-8">
                  <h3 className={`text-sm font-bold uppercase tracking-widest mb-6 ${plan.id === 'growth' ? 'text-primary' : 'text-gray-400'}`}>
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-base font-semibold text-gray-400">KES</span>
                    <span className="text-5xl font-bold tracking-tight text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500 font-medium">/ unit</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8 pb-8 border-b border-gray-200/60">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <span className="text-sm text-gray-600 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <Link href={plan.ctaLink} className="block w-full">
                    <Button className="w-full h-12 rounded-full font-semibold text-base">
                      {plan.cta}
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-gray-400 font-medium">
                    {plan.footerNote}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Billing Details */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notifications</p>
                <p className="text-sm text-gray-600">Rent-due reminders and payment confirmations included.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billing Model</p>
                <p className="text-sm text-gray-600">Billed monthly per occupied unit at invoice time.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Multiple properties</p>
                <p className="text-sm text-gray-600">Manage as many properties as you need on one plan.</p>
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

      {/* FAQ */}
      <section className="py-24 px-4 bg-gray-50/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-primary mb-12 text-center">
            Common Questions
          </h2>

          <div className="space-y-10">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <h4 className="font-bold text-gray-900 text-lg mb-2">{faq.q}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-white p-10 rounded-3xl shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p className="font-bold text-primary text-xl mb-1">Still have questions?</p>
                <p className="text-gray-600">We&apos;re here to help you get started with Rumia.</p>
              </div>
              <Link href="/contact">
                <Button className="rounded-full px-8 h-12 font-semibold">Contact Us</Button>
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
