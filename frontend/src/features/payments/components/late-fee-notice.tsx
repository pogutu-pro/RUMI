'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface LateFeeNoticeProps {
  amount: number;
  dueDate: Date;
  lateFeeAmount: number;
  lateFeeDate: Date;
}

export function LateFeeNotice({
  amount,
  dueDate,
  lateFeeAmount,
  lateFeeDate,
}: LateFeeNoticeProps) {
  const isOverdue = new Date() > dueDate;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">
            {isOverdue ? 'Payment Overdue' : 'Upcoming Payment Due'}
          </p>
          <div className="text-sm">
            <p>Amount Due: KES {amount.toLocaleString()}</p>
            <p>Due Date: {format(dueDate, 'PPP')}</p>
            {isOverdue && (
              <>
                <p className="mt-2 font-medium">
                  Late Fee: KES {lateFeeAmount.toLocaleString()}
                </p>
                <p>Will be applied on: {format(lateFeeDate, 'PPP')}</p>
              </>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
