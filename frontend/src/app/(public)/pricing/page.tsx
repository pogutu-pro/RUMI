import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { PricingContent } from './_components/pricing-content';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'RumiaRent rental management pricing. Simple, flat monthly billing.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <section className="bg-white py-24 px-4 relative overflow-hidden border-b border-gray-100">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-primary mb-6">
            Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Flat monthly pricing, from Starter to Enterprise. No per-unit surprises.
            Notifications included.
          </p>
        </div>
      </section>

      {/* Trial Notice */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="border border-gray-100 bg-gray-50 p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-bold text-primary text-3xl mb-2">30-day free trial</h3>
              <p className="text-lg text-gray-600">
                New landlords get a 30-day trial with full Enterprise-tier access. No credit card required.
              </p>
            </div>
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button className="rounded-full px-10 h-14 text-lg font-medium">
                Start Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PricingContent />

      {/* Billing Details */}
      <section className="pb-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notifications</p>
                <p className="text-sm text-gray-600">Rent-due reminders and payment confirmations included.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billing Model</p>
                <p className="text-sm text-gray-600">Billed monthly per selected plan — flat pricing, no per-unit metering.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Multiple properties</p>
                <p className="text-sm text-gray-600">Manage as many properties as your plan allows on one account.</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/contact" className="text-sm font-semibold text-gray-900 underline underline-offset-4">
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Legal */}
      <footer className="py-8 border-t border-gray-100 text-center px-4">
        <p className="text-xs text-gray-500">
          Prices exclude VAT where applicable. <Link href="/terms" className="underline">Terms and service apply</Link>.
        </p>
      </footer>
    </div>
  );
}
