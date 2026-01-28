import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Rumi rental management platform pricing. Per-bed monthly billing.',
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
    id: 'core',
    name: 'Core',
    price: 50,
    features: [
      'Student & bed records',
      'Occupancy & rent status',
      'Caretaker & landlord dashboards',
      'Hostel listing & visibility',
    ],
    cta: 'Start Core',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=core`,
    footerNote: 'Basic hostel operations.',
  },
  {
    id: 'control',
    name: 'Control',
    price: 80,
    features: [
      'Everything in Core',
      'Rent verification & payment history',
      'Room transfers & student movement',
      'Advanced reports & exports',
    ],
    cta: 'Start Control',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=control`,
    footerNote: 'Advanced operations management.',
  },
  {
    id: 'finance',
    name: 'Finance',
    price: 150,
    features: [
      'Everything in Control',
      'Compliance-ready financial reports',
      'Priority onboarding & support',
      'Collections onboarding (by application)',
    ],
    cta: 'Apply for Finance',
    ctaLink: '/contact?subject=Finance%20Application',
    footerNote: 'Financial reporting and priority support.',
  },
];

const FAQS = [
  {
    q: 'Does KES 50 include SMS and email?',
    a: 'Yes. All tenant notifications are included—no separate communication fees.',
  },
  {
    q: 'When does Finance (collections) become available?',
    a: 'Collections are available by application after a short onboarding review. Apply from the Finance card.',
  },
  {
    q: 'Can I switch tiers?',
    a: 'Yes. Upgrade or downgrade from your dashboard; billing adjusts next invoice.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <section className="border-b border-gray-200 py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pricing
          </h1>
          <p className="text-lg text-gray-700">
            Per-bed monthly billing. KES 50 - 150 per occupied bed per month. SMS & email notifications included.
          </p>
        </div>
      </section>

      {/* Trial Notice */}
      <section className="py-8 px-4 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto max-w-4xl">
          <div className="border border-gray-200 bg-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">30-day free trial</h3>
              <p className="text-sm text-gray-700">Full access to Core and Control. No payment required.</p>
            </div>
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button>
                Start Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="border border-gray-200 bg-white p-8"
              >
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-sm font-bold text-gray-700">KES</span>
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-700">/ bed / mo</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 pb-8 border-b border-gray-200">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <span className="text-sm text-gray-700">• {feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <Link href={plan.ctaLink} className="block w-full">
                    <Button className="w-full">
                      {plan.cta}
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-gray-500">
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
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Communications</p>
                <p className="text-sm text-gray-700">SMS & email tenant notifications included.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billing Model</p>
                <p className="text-sm text-gray-700">Billed monthly per occupied bed at invoice time.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Discounts</p>
                <p className="text-sm text-gray-700">Multi-property & enterprise terms available.</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link href="/contact" className="text-sm font-bold text-gray-900 underline">
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Questions
          </h2>
          
          <div className="space-y-8">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <h4 className="font-bold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 border border-gray-200 bg-white p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="font-bold text-gray-900 mb-1">Still have questions?</p>
                <p className="text-sm text-gray-700">Contact us for clarification.</p>
              </div>
              <Link href="/contact">
                <Button variant="outline">Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Legal */}
      <footer className="py-8 border-t border-gray-200 text-center px-4">
        <p className="text-xs text-gray-500">
          Prices exclude VAT where applicable. <Link href="/terms" className="underline">Terms and service apply</Link>.
        </p>
      </footer>
    </div>
  );
}
