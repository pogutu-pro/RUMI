'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentReceiptProps {
  transactionId: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  bookingId: string;
  status: 'successful' | 'pending' | 'failed';
  recipient?: {
    name: string;
    email: string;
  };
}

export function PaymentReceipt({
  transactionId,
  amount,
  date,
  paymentMethod,
  bookingId,
  status,
  recipient,
}: PaymentReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download
    console.log('Download receipt');
  };

  return (
    <Card>
      <CardHeader className="text-center border-b">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle>Payment Receipt</CardTitle>
        <Badge
          variant={status === 'successful' ? 'default' : 'secondary'}
          className="mx-auto"
        >
          {status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-mono">{transactionId}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Booking ID</span>
            <span className="font-mono">{bookingId}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{format(date, 'PPP')}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="capitalize">{paymentMethod}</span>
          </div>

          {recipient && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span>{recipient.name}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span>{recipient.email}</span>
              </div>
            </>
          )}

          <div className="flex justify-between font-semibold text-lg pt-4 border-t">
            <span>Amount Paid</span>
            <span>KES {amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
