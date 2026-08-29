import type { Metadata } from 'next';
import { FadeIn } from '@/components/animations/fade-in';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how we protect and handle your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
              Privacy Policy
            </h1>
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
                RumiaRent is owned and operated by Stratnovo.
              </p>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  1. Information We Collect
                </h2>
                <p className="mb-4 leading-relaxed">
                  We collect information that you provide directly to us,
                  including:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Name, email address, and phone number</li>
                  <li>Profile information and preferences</li>
                  <li>
                    Payment information (processed securely through M-PESA)
                  </li>
                  <li>Property listings and booking information</li>
                  <li>Communications with other users</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  2. How We Use Your Information
                </h2>
                <p className="mb-4 leading-relaxed">
                  We use the information we collect to:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze trends and usage</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  3. Information Sharing
                </h2>
                <p className="leading-relaxed">
                  We do not sell, trade, or rent your personal information to
                  third parties. We may share your information only in the
                  following circumstances:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>With your consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>
                    With service providers who assist us in operating our
                    platform
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  4. Data Security
                </h2>
                <p className="leading-relaxed">
                  We implement appropriate technical and organizational measures
                  to protect your personal information against unauthorized
                  access, alteration, disclosure, or destruction. However, no
                  method of transmission over the Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  5. Your Rights
                </h2>
                <p className="mb-4 leading-relaxed">You have the right to:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Object to processing of your information</li>
                  <li>Request data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  6. Cookies and Tracking
                </h2>
                <p className="leading-relaxed">
                  We use cookies and similar tracking technologies to track
                  activity on our platform and hold certain information. You can
                  instruct your browser to refuse all cookies or to indicate
                  when a cookie is being sent.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  7. Childrens Privacy
                </h2>
                <p className="leading-relaxed">
                  Our service is not intended for individuals under the age of
                  18. We do not knowingly collect personal information from
                  children.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  8. Changes to This Policy
                </h2>
                <p className="leading-relaxed">
                  We may update our Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the Last updated date.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  9. Contact Us
                </h2>
                <p className="leading-relaxed">
                  If you have any questions about this Privacy Policy, please
                  contact us at{' '}
                  <a
                    href="mailto:privacy@rumi.app"
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    privacy@rumi.app
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
