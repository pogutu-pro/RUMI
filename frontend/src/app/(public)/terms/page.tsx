import type { Metadata } from 'next';
import { FadeIn } from '@/components/animations/fade-in';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read our terms of service and user agreement.',
};

export default function TermsPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mb-8 text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  1. Acceptance of Terms
                </h2>
                <p className="leading-relaxed">
                  By accessing and using Rumia, you accept and agree to be bound by
                  the terms and provision of this agreement. If you do not agree to
                  abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  2. Use License
                </h2>
                <p className="mb-4 leading-relaxed">
                  Permission is granted to temporarily use Rumia for personal,
                  non-commercial transitory viewing only. This is the grant of a
                  license, not a transfer of title, and under this license you may
                  not:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to reverse engineer any software</li>
                  <li>Remove any copyright or proprietary notations</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  3. User Accounts
                </h2>
                <p className="leading-relaxed">
                  You are responsible for maintaining the confidentiality of your
                  account and password. You agree to accept responsibility for all
                  activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  4. Booking and Payments
                </h2>
                <p className="leading-relaxed">
                  All bookings are subject to availability and confirmation. Payment
                  must be made through approved payment methods. Cancellation
                  policies vary by property and are clearly stated on each listing.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  5. Property Listings
                </h2>
                <p className="leading-relaxed">
                  Landlords are responsible for the accuracy of their listings. Rumia
                  verifies properties but does not guarantee the accuracy of all
                  information. We reserve the right to remove any listing that
                  violates our policies.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  6. Limitation of Liability
                </h2>
                <p className="leading-relaxed">
                  Rumia shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages resulting from your use of or
                  inability to use the service.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  7. Changes to Terms
                </h2>
                <p className="leading-relaxed">
                  We reserve the right to modify these terms at any time. We will
                  notify users of any significant changes. Continued use of the
                  service after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  8. Contact Information
                </h2>
                <p className="leading-relaxed">
                  If you have any questions about these Terms of Service, please
                  contact us at{' '}
                  <a
                    href="mailto:legal@rumi.app"
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    legal@rumi.app
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
