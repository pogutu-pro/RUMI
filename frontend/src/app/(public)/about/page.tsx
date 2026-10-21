import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  alternates: { canonical: '/about' },
  title: 'About RumiaRent',
  description:
    'RumiaRent is rental management software built for Kenyan landlords and property agents: properties, tenants, rent, and payments in one place.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Header */}
      <section className="bg-white py-24 relative overflow-hidden border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-extrabold text-primary sm:text-5xl">
              Rental management, built for how landlords actually work
            </h1>
            <p className="text-xl text-gray-700 font-medium leading-relaxed max-w-3xl">
              RumiaRent is owned and operated by Stratnovo. We build exactly what a
              Kenyan landlord or agent needs to run their rentals, so you can start
              using it today instead of setting it up for a week.
            </p>
          </div>
        </div>
      </section>

      {/* The Reality */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900">
              Most landlords are running rentals on WhatsApp and spreadsheets
            </h2>
            <div className="space-y-6 text-gray-700 leading-relaxed font-medium text-lg">
              <p>
                Not because they don&apos;t care about their business, but because most
                property management software is built for large portfolios with
                dedicated staff, not for a landlord with a handful of units who
                just needs to know who paid and who didn&apos;t.
              </p>
              <p>
                RumiaRent is built for that landlord first: properties, units, tenants,
                and rent charges, with payment collection that actually works in
                Kenya. Tenants pay your own M-Pesa paybill or bank account, and every
                payment is matched and receipted. Cash is one tap to record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Functions */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-bold text-primary">
              What we actually do
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="border border-gray-100 bg-white p-8 rounded-3xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300">
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  Properties & Tenants
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Every property, unit, and tenancy in one record: who lives where,
                  since when, and at what rent.
                </p>
              </div>
              <div className="border border-gray-100 bg-white p-8 rounded-3xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300">
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  Rent & Payments
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Rent charges generate automatically. Payments to your paybill are
                  matched to the right tenant, cash is recorded by hand, and balances stay accurate.
                </p>
              </div>
              <div className="border border-gray-100 bg-white p-8 rounded-3xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300">
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  One place, not five apps
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  No more piecing together a WhatsApp group, a notebook, and a
                  bank statement to know where things stand.
                </p>
              </div>
              <div className="border border-gray-100 bg-white p-8 rounded-3xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300">
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  A real source of truth
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Every payment is tied to a rent charge, and every rent charge to a
                  tenancy, so the numbers always add up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-primary">
              Our approach
            </h2>
            <p className="text-xl text-gray-700 font-medium leading-relaxed mb-8">
              Build what one landlord would pay for. Then make it work for every
              landlord who needs the same thing. We&apos;d rather ship four things
              that work perfectly than forty that don&apos;t.
            </p>
            <div className="flex justify-center gap-4">
              <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
                <Button size="lg">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
