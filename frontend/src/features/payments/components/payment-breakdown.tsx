'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PaymentBreakdownProps {
  subtotal: number;
  commission?: number;
  processingFee?: number;
  total: number;
}

export function PaymentBreakdown({
  subtotal,
  commission = 0,
  processingFee = 0,
  total,
}: PaymentBreakdownProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">KES {subtotal.toLocaleString()}</span>
          </div>

          {commission > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-medium">KES {commission.toLocaleString()}</span>
            </div>
          )}

          {processingFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing Fee</span>
              <span className="font-medium">KES {processingFee.toLocaleString()}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-lg">KES {total.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
