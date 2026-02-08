import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Rumia rental management platform pricing. Per-bed monthly billing.',
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
      <section className="bg-white py-24 px-4 relative overflow-hidden border-b border-gray-200">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-extrabold text-primary mb-6">
            Pricing
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            Per-bed monthly billing. KES 50 - 150 per occupied bed per month. SMS & email notifications included.
          </p>
        </div>
      </section>

      {/* Trial Notice */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="border border-gray-200 bg-white p-10 rounded-none flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div>
              <h3 className="font-black text-primary text-3xl mb-2">30-day free trial</h3>
              <p className="text-lg text-gray-700 font-medium">Full access to Core and Control. No credit card required.</p>
            </div>
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button className="bg-primary text-white hover:bg-primary/90 px-10 py-7 h-auto text-xl font-bold rounded-none shadow-sm">
                Start Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-12">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 ${plan.id === 'control' ? 'border-primary shadow-lg scale-105 z-10' : 'border-gray-100 shadow-sm'} bg-white p-10 rounded-none transition-all relative overflow-hidden`}
              >
                {plan.id === 'control' && (
                  <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 font-bold text-sm tracking-wide">
                    POPULAR
                  </div>
                )}
                <div className="mb-10">
                  <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${plan.id === 'control' ? 'text-primary' : 'text-gray-400'} mb-6`}>
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-lg font-bold text-gray-400">KES</span>
                    <span className={`text-6xl font-black tracking-tighter text-gray-900`}>{plan.price}</span>
                    <span className="text-base text-gray-500 font-bold">/ bed</span>
                  </div>
                </div>

                <div className="space-y-5 mb-10 pb-10 border-b border-gray-100">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-4">
                      <CheckCircle2 className={`h-6 w-6 shrink-0 text-primary`} />
                      <span className="text-base text-gray-600 font-semibold">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <Link href={plan.ctaLink} className="block w-full">
                    <Button className={`w-full h-14 rounded-none font-black text-lg transition-all shadow-sm active:scale-95 bg-primary text-white hover:bg-primary/90`}>
                      {plan.cta}
                    </Button>
                  </Link>
                  <p className="text-sm text-center text-gray-400 font-bold">
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
      <section className="py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-primary mb-12 text-center">
            Common Questions
          </h2>
          
          <div className="space-y-12">
            {FAQS.map((faq) => (
              <div key={faq.q} className="group">
                <h4 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-primary transition-colors">{faq.q}</h4>
                <p className="text-gray-700 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-20 border border-primary/10 bg-white p-10 rounded-3xl shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p className="font-bold text-primary text-xl mb-1">Still have questions?</p>
                <p className="text-gray-600 font-medium">We're here to help you get started with Rumia.</p>
              </div>
              <Link href="/contact">
                <Button className="bg-primary text-white hover:bg-primary/90 px-8 rounded-xl h-12 font-bold">Contact Us</Button>
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
