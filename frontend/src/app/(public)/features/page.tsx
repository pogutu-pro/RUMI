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
      <section className="bg-white py-24 relative overflow-hidden border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-4xl font-extrabold text-primary">
              Platform Features
            </h1>
            <p className="text-xl text-gray-700 font-medium leading-relaxed">
              Core functions available to students and landlords.
            </p>
          </div>
        </div>
      </section>

      {/* Student Features */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-bold text-primary">
              For Students
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {STUDENT_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white p-8 rounded-none border-b-4 border-gray-100 shadow-sm hover:border-primary transition-all"
                >
                  <h3 className="mb-3 text-xl font-bold text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 font-medium">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Landlord Features */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-bold text-primary">
              For Landlords
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {LANDLORD_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-gray-50 p-8 rounded-none border-b-4 border-gray-200 shadow-sm hover:border-primary transition-all"
                >
                  <h3 className="mb-3 text-xl font-bold text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 font-medium">
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
