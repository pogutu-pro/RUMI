import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Rumi - The Operating System for Student Housing',
  description:
    'Rumi is the infrastructure layer for student housing in kenya, connecting listings, bookings, payments, and operations.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Header */}
      <section className="bg-white py-24 relative overflow-hidden border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-extrabold text-primary sm:text-5xl">
              RUMI — The Operating System for Student Housing in kenya
            </h1>
            <p className="text-xl text-gray-700 font-medium leading-relaxed max-w-3xl">
              We are building the digital infrastructure that powers the entire
              student housing lifecycle — from discovery to move-out.
            </p>
          </div>
        </div>
      </section>

      {/* The Reality */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900">
              Built for How Student Housing Actually Works
            </h2>
            <div className="space-y-6 text-gray-700 leading-relaxed font-medium text-lg">
              <p>
                Most property management software is designed for conventional
                rentals with long-term tenants, predictable billing cycles, and
                simple landlord–tenant relationships. Student housing does not
                work this way.
              </p>
              <p>
                Around universities and colleges, housing is defined by shared
                rooms and beds, semester-based occupancy, high tenant turnover,
                frequent payments, and operational complexity handled by
                caretakers. RUMI is purpose-built for this reality.
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
              Connecting the Entire Lifecycle
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="border border-gray-200 bg-white p-8 rounded-none">
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  Discovery & Booking
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Students find verified listings and book specific beds, not
                  just rooms. We verify every property to ensure safety and
                  quality.
                </p>
              </div>
              <div className="border border-gray-200 bg-white p-8 rounded-none">
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  Integrated Payments
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Deep M-PESA integration (Paybill, STK Push) supports
                  structured rent collection mapped directly to individual
                  students and rent periods.
                </p>
              </div>
              <div className="border border-gray-200 bg-white p-8 rounded-none">
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  Unified Operations
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  A single system for occupancy management, caretaker workflows,
                  and tenant onboarding. No more fragmented WhatsApp groups.
                </p>
              </div>
              <div className="border border-gray-200 bg-white p-8 rounded-none">
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  System of Record
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Rumi provides a single source of truth for financial
                  reporting, reducing disputes and giving owners real-time
                  visibility.
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
              Our Mission
            </h2>
            <p className="text-xl text-gray-700 font-medium leading-relaxed mb-8">
              To bring order, transparency, and scalability to student housing
              in kenya. Rumi is the platform that brings modern financial and
              operational workflows to the student accommodation sector.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/hostels" prefetch>
                <Button size="lg">Explore Listings</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
