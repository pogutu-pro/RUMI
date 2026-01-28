import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Platform features for students and landlords.',
};

const STUDENT_FEATURES = [
  {
    title: 'Search and Filter',
    description:
      'Filter hostels by location, price range, room type, and amenities.',
  },
  {
    title: 'Verified Listings',
    description:
      'All hostels undergo license verification and physical inspection.',
  },
  {
    title: 'M-PESA Payments',
    description:
      'Pay rent securely via M-PESA with instant confirmation.',
  },
  {
    title: 'Booking History',
    description:
      'Access past bookings and payment receipts from your dashboard.',
  },
];

const LANDLORD_FEATURES = [
  {
    title: 'Property Listing',
    description:
      'Upload hostel details, photos, and set room pricing.',
  },
  {
    title: 'Availability Control',
    description:
      'Update room availability in real-time as students book.',
  },
  {
    title: 'Payment Tracking',
    description:
      'View all incoming M-PESA payments and download reports.',
  },
  {
    title: 'Booking Management',
    description:
      'Review student bookings and manage check-in dates.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-3xl font-bold text-gray-900">
              Platform Features
            </h1>
            <p className="text-lg text-gray-700">
              Core functions available to students and landlords.
            </p>
          </div>
        </div>
      </section>

      {/* Student Features */}
      <section className="bg-white py-16 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">
              For Students
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {STUDENT_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="border border-gray-200 bg-white p-6"
                >
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Landlord Features */}
      <section className="bg-gray-50 py-16 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">
              For Landlords
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {LANDLORD_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="border border-gray-200 bg-white p-6"
                >
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-700">
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
              <Link href="/hostels" prefetch>
                <Button size="lg">
                  Browse Hostels
                </Button>
              </Link>
              <Link href="/register" prefetch>
                <Button size="lg" variant="outline">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
