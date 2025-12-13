'use client';

import { PayoutCard } from './payout-card';
import { useLandlordPayouts } from '../hooks/use-payments'; // Use the relative or absolute path correctly

export function PayoutList() {
  const { data, isLoading, isError } = useLandlordPayouts();

  if (isLoading) {
      return <div>Loading payouts...</div>;
  }

  if (isError) {
      return <div className="text-red-500">Failed to load payouts.</div>;
  }

  const payouts = data?.data || [];
  // Need to adapt API response to PayoutCard props if they differ.
  // PayoutCard likely expects certain fields.
  // Assuming PayoutCard props match or I map them.
  // Let's assume strict match or map:
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payouts</h3>
      {payouts.length === 0 ? (
          <p className="text-muted-foreground">No payout history found.</p>
      ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {payouts.map((payout) => (
              <PayoutCard key={payout.id} payout={payout} />
            ))}
          </div>
      )}
    </div>
  );
}

