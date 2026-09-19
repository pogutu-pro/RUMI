import type { Metadata } from 'next';
import { OpenRoles } from '@/features/careers/components/open-roles';

export const metadata: Metadata = {
  alternates: { canonical: '/careers' },
  title: 'Careers',
  description:
    'Join RumiaRent. See the roles we are hiring for, or tell us how you would like to help build rental management for Kenya.',
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <section className="bg-white py-24 px-4 relative overflow-hidden border-b border-gray-100">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-primary mb-6">Careers</h1>
          <p className="text-xl text-gray-600 mb-4">
            RumiaRent builds rental-management software for Kenyan landlords, caretakers, and
            tenants: properties, tenancies, rent, and payments, all in one place.
          </p>
          <p className="text-xl text-gray-600">
            Have a look at the roles below. If nothing fits, we still enjoy hearing from people who
            want to work on it.
          </p>
        </div>
      </section>

      {/* Openings */}
      <section className="bg-white px-4 py-20">
        <OpenRoles />
      </section>
    </div>
  );
}
