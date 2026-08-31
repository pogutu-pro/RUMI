'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PriceDisplay } from '@/components/ui/price-display';
import { usePlans } from '@/features/billing/hooks/use-plans';

/**
 * Homepage pricing teaser — replaces the old hardcoded "From KES 50 per
 * unit, per month" copy with the live Phase 1 tier catalog via usePlans()
 * (D-08). This is a single-card summary linking out to /pricing for the
 * full 3-card grid, so the loading state is one skeleton block, not three
 * (the UI-SPEC's "3 skeleton cards" requirement is satisfied on /pricing).
 */
export function PricingTeaser() {
  const { data, isLoading, isError, refetch } = usePlans();

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-8 rounded-3xl bg-gray-50/60 p-10 text-center shadow-sm sm:flex-row sm:text-left">
        <div className="w-full space-y-3 sm:w-auto">
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
          <div className="skeleton h-8 w-64 max-w-full" />
          <div className="skeleton h-5 w-48 max-w-full" />
        </div>
        <div className="skeleton h-12 w-40 rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load pricing"
        message="We're having trouble reaching pricing right now. Try again in a moment."
        onRetry={() => refetch()}
        className="rounded-3xl"
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        variant="alert"
        title="Pricing unavailable right now"
        description="We couldn't load our current plans. Refresh the page, or contact support if this keeps happening."
        className="rounded-3xl"
      />
    );
  }

  const cheapestPlan = data.reduce((lowest, plan) =>
    parseFloat(plan.price) < parseFloat(lowest.price) ? plan : lowest,
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-8 rounded-3xl bg-gray-50/60 p-10 text-center shadow-sm sm:flex-row sm:text-left">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
        <h3 className="text-2xl font-bold text-gray-900">
          From <PriceDisplay amount={cheapestPlan.price} size="lg" showDecimals={false} />/month
        </h3>
        <p className="mt-1 text-gray-600">
          {data.length} plans, starting with {cheapestPlan.name}
        </p>
      </div>
      <Link href="/pricing" prefetch>
        <Button size="lg" variant="outline" className="rounded-full px-8 font-semibold">
          See full pricing
        </Button>
      </Link>
    </div>
  );
}
