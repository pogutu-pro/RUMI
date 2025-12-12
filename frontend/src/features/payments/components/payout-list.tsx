'use client';

import { PayoutCard } from './payout-card';

const mockPayouts = [
  {
    id: '1',
    amount: 50000,
    status: 'completed' as const,
    scheduledDate: new Date(),
    method: 'Bank Transfer',
  },
  {
    id: '2',
    amount: 35000,
    status: 'pending' as const,
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    method: 'M-Pesa',
  },
];

export function PayoutList() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payouts</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {mockPayouts.map((payout) => (
          <PayoutCard key={payout.id} payout={payout} />
        ))}
      </div>
    </div>
  );
}
