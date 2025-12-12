'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface RecurringPayment {
  id: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'quarterly';
  nextPaymentDate: Date;
  status: 'active' | 'paused' | 'cancelled';
  method: string;
}

interface RecurringPaymentCardProps {
  payment: RecurringPayment;
  onPause?: () => void;
  onCancel?: () => void;
}

export function RecurringPaymentCard({
  payment,
  onPause,
  onCancel,
}: RecurringPaymentCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{payment.frequency}</span>
        </div>
        <Badge
          variant={
            payment.status === 'active'
              ? 'default'
              : payment.status === 'paused'
              ? 'secondary'
              : 'destructive'
          }
        >
          {payment.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold">KES {payment.amount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">per {payment.frequency.replace('ly', '')}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Next: {format(payment.nextPaymentDate, 'PP')}</span>
          </div>

          <p className="text-sm text-muted-foreground">via {payment.method}</p>

          {payment.status === 'active' && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={onPause}>
                Pause
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
