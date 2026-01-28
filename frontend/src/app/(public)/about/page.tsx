import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Rumi connects students with verified campus accommodation in Kenya.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-3xl font-bold text-gray-900">
              About Rumi
            </h1>
            <p className="text-lg text-gray-700">
              Student accommodation booking platform for verified hostels near Kenyan universities.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              What We Do
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Rumi is a booking platform connecting students with verified hostel accommodation near their campuses.
              </p>
              <p>
                We verify property licenses, inspect physical conditions, and facilitate secure M-PESA payments between students and landlords.
              </p>
              <p>
                Landlords list properties, manage availability, and receive rent payments. Students search by location, price, and amenities, then book directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Functions */}
      <section className="bg-gray-50 py-16 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">
              Platform Functions
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  title: 'Property Verification',
                  description:
                    'Check hostel licenses and inspect physical premises before listing.',
                },
                {
                  title: 'Secure Payments',
                  description:
                    'M-PESA integration for rent collection and instant receipts.',
                },
                {
                  title: 'Availability Management',
                  description:
                    'Real-time room status updates and booking confirmations.',
                },
                {
                  title: 'Support System',
                  description:
                    'Direct support line for booking and payment issues.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-gray-200 bg-white p-6"
                >
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Get Started
            </h2>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/hostels" prefetch>
                <Button size="lg">
                  Browse Hostels
                </Button>
              </Link>
              <Link href="/contact" prefetch>
                <Button size="lg" variant="outline">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
