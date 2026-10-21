import type { Metadata } from 'next';
import { FadeIn } from '@/components/animations/fade-in';

export const metadata: Metadata = {
  alternates: { canonical: '/compliance' },
  title: 'Compliance',
  description: 'How RumiaRent handles data protection and payment security.',
};

export default function CompliancePage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">Compliance</h1>
            <p className="mb-8 text-lg text-gray-600">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
              <p className="leading-relaxed">
                RumiaRent is owned and operated by Stratnovo. Here is how we approach data
                protection and payment security today.
              </p>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">1. Data Protection</h2>
                <p className="leading-relaxed">
                  We operate with Kenya&apos;s Data Protection Act, 2019 in mind: we collect only the
                  information needed to run the platform, restrict who can see it by role, and never
                  sell tenant or landlord data to third parties.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">2. Payment Security</h2>
                <p className="leading-relaxed">
                  RumiaRent never holds or moves rent money. Tenants pay the landlord&apos;s own M-Pesa
                  paybill or bank account; we only receive the notice that a payment happened. Card
                  payments for RumiaRent subscriptions are handled by Paystack, a PCI-DSS compliant
                  processor, and we never see or store card details.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">3. Platform Security</h2>
                <ul className="ml-6 list-disc space-y-2">
                  <li>All traffic to RumiaRent is encrypted in transit (HTTPS).</li>
                  <li>
                    Access is role-based: landlords, caretakers, and tenants only see the data their
                    role allows.
                  </li>
                  <li>
                    Every account&apos;s data is isolated from every other account on the platform.
                  </li>
                  <li>Sensitive actions are logged in an audit trail.</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">4. Questions</h2>
                <p className="leading-relaxed">
                  If you have a compliance question, reach out through our{' '}
                  <a href="/contact" className="underline">
                    contact page
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
