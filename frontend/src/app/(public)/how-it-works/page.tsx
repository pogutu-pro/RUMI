import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'How RumiaRent works for landlords, agents, and tenants.',
};

const LANDLORD_STEPS = [
  {
    title: 'Add your properties',
    description: 'Create a property, then add its units, whether that’s apartments, houses, or an estate.',
  },
  {
    title: 'Add tenants & tenancies',
    description: 'Attach a tenant to a unit with a monthly rent and start date.',
  },
  {
    title: 'Rent charges generate automatically',
    description: 'Each billing period, RumiaRent creates the next rent charge for every active tenancy.',
  },
  {
    title: 'Collect and record payments',
    description: 'Tenants pay via Paystack, or you record cash and bank payments. Balances update instantly.',
  },
];

const TENANT_STEPS = [
  {
    title: 'See your tenancy',
    description: 'Your unit, your monthly rent, and your current balance, all in one dashboard.',
  },
  {
    title: 'Pay your rent',
    description: 'Pay securely via Paystack whenever it’s due.',
  },
  {
    title: 'Keep your receipts',
    description: 'Every payment is confirmed and recorded, ready whenever you need it.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <section className="border-b border-gray-100 py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How RumiaRent Works
          </h1>
          <p className="text-lg lg:text-xl text-gray-600">
            Properties, tenants, rent, and payments. Set up in minutes, not a project.
          </p>
        </div>
      </section>

      {/* For Landlords & Agents */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              For Landlords & Agents
            </h2>
            <p className="text-lg text-gray-600">
              Four steps from a blank account to tracking real rent.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {LANDLORD_STEPS.map((step, i) => (
              <div
                key={step.title}
                className="bg-gray-50 rounded-3xl p-8 text-center transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1 duration-300"
              >
                <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`}>
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-medium">
                Start managing your properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Tenants */}
      <section className="py-20 px-4 bg-gray-50/50">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              For Tenants
            </h2>
            <p className="text-lg text-gray-600">
              See your rent and pay it, from one dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TENANT_STEPS.map((step, i) => (
              <div
                key={step.title}
                className="bg-white rounded-3xl p-8 text-center shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
              >
                <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it's simple */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Built to stay simple
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                RumiaRent does what one landlord actually needs, and nothing you have to
                configure before it&apos;s useful.
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Real-time balances</h4>
                  <p className="text-sm text-gray-600">Outstanding and overdue rent, updated the moment a payment lands.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">One account, every property</h4>
                  <p className="text-sm text-gray-600">Manage as many properties and units as you need from a single login.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl p-8">
              <h3 className="font-bold text-gray-900 mb-4">What&apos;s included</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>Paystack payment integration</li>
                <li>Cash and bank payment recording</li>
                <li>Automatic monthly rent charges</li>
                <li>Outstanding and overdue tracking</li>
                <li>Rent-due and payment-confirmation notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-6">
            Start Using RumiaRent
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Replace spreadsheets and WhatsApp with rent tracking built for landlords.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-medium bg-white text-gray-900 hover:bg-gray-100">
                Create Account
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-medium border-white text-white hover:bg-white hover:text-gray-900">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
