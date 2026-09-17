import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    "RumiaRent isn't actively hiring right now, but we'd love to hear from people interested in working on it.",
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
            We&apos;re not actively hiring for any open roles right now, but we&apos;d love to hear
            from people interested in working on it. We keep notes on file for when that changes.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-2xl">
          <div className="border border-gray-100 bg-gray-50 p-10 rounded-3xl text-center">
            <h2 className="font-bold text-primary text-3xl mb-3">Get in touch</h2>
            <p className="text-lg text-gray-600 mb-8">
              If you&apos;d like to introduce yourself, reach out and tell us a bit about what you do.
            </p>
            <Link href="/contact">
              <Button className="rounded-full px-10 h-14 text-lg font-medium">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
