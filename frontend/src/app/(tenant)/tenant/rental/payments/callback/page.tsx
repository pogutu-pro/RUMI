'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { rentalApi } from '@/features/rental/api/client';

/**
 * Paystack redirects the browser here after checkout (see FRONTEND_URL/payments/{id}/callback
 * built in rumia_api PaymentListCreateView.post). The actual payment confirmation is
 * NEVER decided by this page — only the server-verified Paystack webhook flips a
 * payment to 'success'. This page just polls our own API for the current state.
 */
export default function PaymentCallbackPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['rental', 'payments'],
    queryFn: rentalApi.listPayments,
    refetchInterval: (query) => {
      const latest = query.state.data?.[0];
      return latest && latest.status === 'processing' ? 2000 : false;
    },
  });

  const latest = payments?.[0];

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
            <p className="font-medium text-green-600">Payment received — thank you.</p>
            <p>Reference: <span className="font-mono text-xs">{latest.internal_reference}</span></p>
            <p>Amount: KES {latest.amount}</p>
          </>
        ) : latest.status === 'processing' ? (
          <p className="text-muted-foreground">Confirming with Paystack — this updates automatically.</p>
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
