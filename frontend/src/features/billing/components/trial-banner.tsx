'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Gift, Info } from 'lucide-react';
import { useBillingAccess } from '../hooks/use-subscription';

const BILLING_HREF = '/landlord/rental/billing';

/**
 * Tells a new landlord they are on the free Enterprise trial (and for how
 * long), and tells one whose trial has ended what changed. Renders nothing
 * for paying landlords.
 */
export function TrialBanner() {
  const { data } = useBillingAccess();

  if (!data) return null;

  if (data.on_trial) {
    const days = data.trial_days_left;
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3.5">
        <Gift className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-foreground">
          <span className="font-semibold">Free Enterprise trial</span>
          <span className="text-muted-foreground">
            {' '}
            · {days} {days === 1 ? 'day' : 'days'} left (until {format(new Date(data.trial_ends_at), 'd MMM yyyy')}). Everything is
            unlocked while you set up.
          </span>
        </p>
        <Link href={BILLING_HREF} className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
          Choose a plan
        </Link>
      </div>
    );
  }

  if (data.trial_expired) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5">
        <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-foreground">
          <span className="font-semibold">Your free trial has ended.</span>
          <span className="text-muted-foreground"> You are on the Starter plan limits. Pick a plan to unlock more.</span>
        </p>
        <Link href={BILLING_HREF} className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
          See plans
        </Link>
      </div>
    );
  }

  return null;
}
