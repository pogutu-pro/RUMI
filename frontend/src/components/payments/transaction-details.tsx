'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionDetailsProps {
  transactionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetails({
  transactionId,
  open,
  onOpenChange,
}: TransactionDetailsProps) {
  // Mock data - replace with actual hook
  const transaction = {
    id: transactionId,
    amount: 15000,
    type: 'payment',
    status: 'completed',
    date: new Date(),
    method: 'M-Pesa',
    reference: 'REF123456',
    description: 'Hostel booking payment',
    recipient: {
      name: 'Example Hostel',
      email: 'hostel@example.com',
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Transaction Details
            <Badge variant="default">{transaction.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono">{transaction.id}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono">{transaction.reference}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span>{format(transaction.date, 'PPp')}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span>{transaction.method}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">{transaction.type}</span>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Description</p>
            <p className="text-sm text-muted-foreground">{transaction.description}</p>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Amount</span>
            <span>KES {transaction.amount.toLocaleString()}</span>
          </div>

          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
