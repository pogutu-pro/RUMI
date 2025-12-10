'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CommissionBreakdownProps {
  bookingAmount: number;
  commissionRate: number;
  platformFee: number;
  landlordPayout: number;
}

export function CommissionBreakdown({
  bookingAmount,
  commissionRate,
  platformFee,
  landlordPayout,
}: CommissionBreakdownProps) {
  const commissionAmount = (bookingAmount * commissionRate) / 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <h4 className="font-medium">Commission Breakdown</h4>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Booking Amount</span>
            <span className="font-medium">KES {bookingAmount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Commission ({commissionRate}%)
            </span>
            <span className="font-medium text-destructive">
              - KES {commissionAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee</span>
            <span className="font-medium text-destructive">
              - KES {platformFee.toLocaleString()}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Landlord Payout</span>
            <span className="text-lg text-green-600">
              KES {landlordPayout.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
