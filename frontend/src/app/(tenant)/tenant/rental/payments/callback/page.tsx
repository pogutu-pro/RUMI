'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { rentalApi } from '@/features/rental/api/client';
import type { Payment } from '@/features/rental/types';

/**
 * Paystack redirects the browser here after checkout, to the callback_url built in
 * rumia_api PaymentListCreateView.post (`?payment_id=<id>`, plus Paystack's own
 * `reference`/`trxref`). The actual payment confirmation is NEVER decided by this
 * page — only the server-verified Paystack webhook flips a payment to 'success'.
 * This page just polls our own API for the current state of THIS payment.
 */
function findPayment(payments: Payment[] | undefined, paymentId: string | null, reference: string | null) {
  if (!payments) return undefined;
  if (paymentId) return payments.find((p) => p.id === paymentId);
  if (reference) return payments.find((p) => p.internal_reference === reference);
  return payments[0]; // List is newest first.
}

export default function PaymentCallbackPage() {
  return (
    <React.Suspense fallback={<p className="text-sm text-muted-foreground">Checking…</p>}>
      <PaymentCallbackStatus />
    </React.Suspense>
  );
}

function PaymentCallbackStatus() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['rental', 'payments'],
    queryFn: () => rentalApi.listPayments(),
    refetchInterval: (query) => {
      const current = findPayment(query.state.data, paymentId, reference);
      return current && current.status === 'processing' ? 2000 : false;
    },
  });

  const latest = findPayment(payments, paymentId, reference);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isLoading ? (
          <p className="text-muted-foreground">Checking…</p>
        ) : !latest ? (
          <p className="text-muted-foreground">No payment found.</p>
        ) : latest.status === 'success' ? (
          <>
            <p className="font-medium text-success">Payment received, thank you.</p>
            <p>Reference: <span className="font-mono text-xs">{latest.internal_reference}</span></p>
            <p>Amount: KES {latest.amount}</p>
          </>
        ) : latest.status === 'processing' ? (
          <p className="text-muted-foreground">Confirming with Paystack, this updates automatically.</p>
        ) : (
          <p className="text-destructive">Payment was not completed. You can try again.</p>
        )}
        <Button asChild className="w-full">
          <Link href="/tenant/rental">Back to my rental</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
