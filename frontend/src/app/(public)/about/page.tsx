import Link from 'next/link';
import type { Metadata } from 'next';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { PageIntro } from '@/components/marketing/page-intro';

export const metadata: Metadata = {
  title: 'About',
  description:
    'RumiaRent is rental management software for landlords and property agents in Kenya, built and run by Stratnovo in Nairobi.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <section className="px-4 pb-24 pt-12 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <PageIntro title="About RumiaRent">
          Rental management for landlords and agents in Kenya, built and run by Stratnovo in Nairobi.
        </PageIntro>
        <div className="mt-12 max-w-2xl space-y-5 text-lg leading-relaxed text-gray-700">
          <p>
            Most landlords run their rentals on M-Pesa messages, a notebook and WhatsApp. Most property software is
            built for big portfolios with an accounts team. RumiaRent is built for the landlord who just needs to know
            who has paid.
          </p>
          <p>
            Tenants keep paying your own paybill. RumiaRent records each payment against the right tenant, sends the
            receipt and reminds whoever is late. We never hold your money.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={AUTH_ROUTES.REGISTER} className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">
            Start free for 30 days
          </Link>
          <Link href="/contact" className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-5 text-sm font-semibold text-gray-900 hover:bg-gray-50">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
