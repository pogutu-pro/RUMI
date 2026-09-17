'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PriceDisplay } from '@/components/ui/price-display';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { usePlans } from '@/features/billing/hooks/use-plans';
import type { SubscriptionPlan } from '@/features/billing/types';

const FAQS = [
  {
    q: 'Does the price include notifications?',
    a: 'Yes. Rent-due reminders and payment confirmations are included, with no separate messaging fees.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes. Upgrade or downgrade from your dashboard at any time; billing adjusts on your next invoice.',
  },
  {
    q: 'Do you support M-Pesa and bank payments?',
    a: 'Yes. Payments run through Paystack, which covers M-Pesa, bank transfers, and cards, so tenants can pay however is easiest for them.',
  },
  {
    q: 'What happens after my 30-day trial?',
    a: "You'll be prompted to choose a plan before your trial ends, and we'll send a reminder in advance. No card is required to start, so there's no surprise charge.",
  },
];

function formatFeatureKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatLimit(count: number, singular: string, plural: string): string {
  if (count === 0) return `Unlimited ${plural}`;
  return `${count} ${count === 1 ? singular : plural}`;
}

function planFeatures(plan: SubscriptionPlan): string[] {
  const featureFlags = Object.entries(plan.features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => formatFeatureKey(key));

  return [
    formatLimit(plan.max_properties, 'property', 'properties'),
    formatLimit(plan.max_units, 'unit', 'units'),
    formatLimit(plan.max_caretaker_seats, 'caretaker seat', 'caretaker seats'),
    ...featureFlags,
  ];
}

function PlanGridSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-3xl p-10 border border-gray-100 shadow-sm bg-gray-50/50 space-y-6">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-32" />
          <div className="space-y-3 border-t border-gray-200/60 pt-6">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
          <div className="skeleton h-12 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PricingContent() {
  const { data, isLoading, isError, refetch } = usePlans();

  return (
    <>
      {/* Pricing Cards */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          {isLoading && <PlanGridSkeleton />}

          {!isLoading && isError && (
            <ErrorState
              title="Couldn't load pricing"
              message="We're having trouble reaching pricing right now. Try again in a moment."
              onRetry={() => refetch()}
              className="rounded-3xl"
            />
          )}

          {!isLoading && !isError && (!data || data.length === 0) && (
            <EmptyState
              variant="alert"
              title="Pricing unavailable right now"
              description="We couldn't load our current plans. Refresh the page, or contact support if this keeps happening."
              className="rounded-3xl"
            />
          )}

          {!isLoading && !isError && data && data.length > 0 && (
            <div className="grid lg:grid-cols-3 gap-8">
              {data.map((plan) => {
                const isRecommended = plan.slug === 'pro';
                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-10 transition-all relative overflow-hidden ${
                      isRecommended
                        ? 'border-2 border-primary shadow-xl lg:scale-105 z-10 bg-white'
                        : 'border border-gray-100 shadow-sm bg-gray-50/50'
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute top-6 right-6 bg-primary text-white px-4 py-1 rounded-full font-semibold text-xs tracking-wide">
                        POPULAR
                      </div>
                    )}
                    <div className="mb-8">
                      <h3
                        className={`text-sm font-bold uppercase tracking-widest mb-6 ${
                          isRecommended ? 'text-primary' : 'text-gray-400'
                        }`}
                      >
                        {plan.name}
                      </h3>

                      <div className="flex items-baseline gap-2 mb-2">
                        <PriceDisplay amount={plan.price} size="xl" showDecimals={false} />
                        <span className="text-sm text-gray-500 font-medium">/month</span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 pb-8 border-b border-gray-200/60">
                      {planFeatures(plan).map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                          <span className="text-sm text-gray-600 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <Link href={`${AUTH_ROUTES.REGISTER}?plan=${plan.slug}`} className="block w-full">
                        <Button className="w-full h-12 rounded-full font-semibold text-base">
                          Start {plan.name}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-gray-50/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-primary mb-12 text-center">Common Questions</h2>

          <div className="space-y-10">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <h4 className="font-bold text-gray-900 text-lg mb-2">{faq.q}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-white p-10 rounded-3xl shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p className="font-bold text-primary text-xl mb-1">Still have questions?</p>
                <p className="text-gray-600">We&apos;re here to help you get started with RumiaRent.</p>
              </div>
              <Link href="/contact">
                <Button className="rounded-full px-8 h-12 font-semibold">Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
