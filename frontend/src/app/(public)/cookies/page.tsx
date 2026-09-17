import type { Metadata } from 'next';
import { FadeIn } from '@/components/animations/fade-in';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How RumiaRent uses cookies.',
};

export default function CookiePolicyPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">Cookie Policy</h1>
            <p className="mb-8 text-lg text-gray-600">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
              <p className="leading-relaxed">RumiaRent is owned and operated by Stratnovo.</p>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">1. What Cookies We Use</h2>
                <p className="mb-4 leading-relaxed">
                  RumiaRent uses a small number of strictly necessary cookies to keep you signed in
                  and to remember your role while you use the site. We do not use third-party
                  advertising or tracking cookies.
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <span className="font-semibold">Session cookies</span> — keep you signed in
                    between page loads, so you are not asked to log in on every visit.
                  </li>
                  <li>
                    <span className="font-semibold">Role cookie</span> — remembers whether you are
                    signed in as a landlord, caretaker, or tenant, so the site shows the right
                    dashboard.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">2. Why We Use Them</h2>
                <p className="leading-relaxed">
                  These cookies exist only to make the product work — keeping you logged in
                  securely and routing you to the right part of the platform. They are not used to
                  build an advertising profile of you, and we don&apos;t sell or share them with
                  third parties.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">3. Managing Cookies</h2>
                <p className="leading-relaxed">
                  Because these cookies are required for the platform to function, blocking them in
                  your browser will prevent you from staying signed in. You can clear cookies at any
                  time through your browser settings; you will simply need to log in again.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">4. Questions</h2>
                <p className="leading-relaxed">
                  If you have questions about this policy, reach out through our{' '}
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
