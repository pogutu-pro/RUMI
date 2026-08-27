import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'Features',
  description: 'What RUMIA does for landlords, agents, and tenants.',
};

const LANDLORD_FEATURES = [
  {
    title: 'Properties & units',
    description:
      'Organize every property into units, whether that’s apartments, houses, or an estate. See vacancy status at a glance.',
  },
  {
    title: 'Tenants & tenancies',
    description:
      'Attach tenants to units with a start date and rent amount. One active tenancy per unit, always.',
  },
  {
    title: 'Automatic rent charges',
    description:
      'RUMIA generates the next rent charge for every active tenancy, so there is no manual invoicing.',
  },
  {
    title: 'Paystack & cash payments',
    description:
      'Accept card and bank payments via Paystack, or record cash and bank payments yourself.',
  },
  {
    title: 'Outstanding & overdue tracking',
    description:
      'See exactly who owes what, and which charges are overdue, without opening a spreadsheet.',
  },
  {
    title: 'Caretaker access, scoped',
    description:
      'Give caretakers access to only the properties they manage. Nothing more.',
  },
];

const TENANT_FEATURES = [
  {
    title: 'Your tenancy, at a glance',
    description: 'See your unit, your monthly rent, and when it’s due.',
  },
  {
    title: 'Real-time balance',
    description: 'Know exactly what you owe, with no waiting on your landlord to tell you.',
  },
  {
    title: 'Pay via Paystack',
    description: 'Pay your rent securely from your dashboard, in seconds.',
  },
  {
    title: 'Payment history',
    description: 'Every payment is recorded and confirmed, always available to you.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Header */}
      <section className="bg-white py-24 relative overflow-hidden border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-4xl font-bold text-primary">
              Built for how rentals actually work
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Properties, tenants, rent, and payments. Everything a landlord or agent
              actually needs, and nothing they don&apos;t.
            </p>
          </div>
        </div>
      </section>

      {/* Landlord Features */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-bold text-gray-900">
              For Landlords & Agents
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {LANDLORD_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
                >
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tenant Features */}
      <section className="bg-gray-50/50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-bold text-gray-900">
              For Tenants
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {TENANT_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
                >
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
                <Button size="lg" className="rounded-full h-14 px-8 text-lg font-medium">
                  Start managing your properties
                </Button>
              </Link>
              <Link href="/pricing" prefetch>
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-medium">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
