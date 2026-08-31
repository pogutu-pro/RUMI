'use client';

import * as React from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { usePayoutStatus } from '../hooks/use-payout';

/**
 * Persistent dashboard nag banner (D-04) — renders on every /landlord/rental
 * page while the org's PayoutAccount status is not yet 'active'. Collapsible,
 * never removable: the toggle only hides the body text, it never unmounts
 * the banner or persists a "dismissed" flag.
 */
export function PayoutPendingBanner() {
  const { data } = usePayoutStatus();
  const [expanded, setExpanded] = React.useState(true);

  if (!data || data.status === 'active') return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="flex-1 text-sm font-semibold text-foreground">
          Finish setting up your payouts
        </p>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded && (
        <p className="mt-2 text-sm text-muted-foreground">
          {
            "Your bank details are submitted and being verified. Rent payments won't route to you until this completes."
          }
        </p>
      )}
    </div>
  );
}
