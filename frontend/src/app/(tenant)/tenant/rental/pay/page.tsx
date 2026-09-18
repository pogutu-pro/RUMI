'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { useTenancies, useRentBalance, useInitiatePayment } from '@/features/rental/hooks/use-rental';

function formatKes(amount: string | number) {
  const n = Number(amount);
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function TenantPayRentPage() {
  const {
    data: tenancies = [],
    isLoading: tenanciesLoading,
    isError: tenanciesError,
  } = useTenancies();
  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useRentBalance();
  const initiate = useInitiatePayment();

  const activeTenancy = tenancies.find((t) => t.status === 'active') ?? tenancies[0];
  const outstanding = Number(balance?.outstanding_total ?? '0');
  const defaultAmount = outstanding > 0 ? outstanding : Number(activeTenancy?.monthly_rent ?? 0);

  const [amount, setAmount] = React.useState('');

  React.useEffect(() => {
    if (defaultAmount > 0 && !amount) {
      setAmount(String(defaultAmount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAmount]);

  if (tenanciesError || balanceError) {
    return <ErrorState onRetry={() => refetchBalance()} />;
  }

  if (tenanciesLoading || balanceLoading) {
    return <LoadingSkeleton type="card" />;
  }

  if (!activeTenancy) {
    return <p className="text-sm text-muted-foreground">No tenancy on file yet — contact your landlord.</p>;
  }

  const handlePay = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    const result = await initiate.mutateAsync({ tenancyId: activeTenancy.id, amount: String(numericAmount) });
    if (result.authorization_url) {
      window.location.href = result.authorization_url;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pay Rent" description="Pay what's due, or pay ahead of time — any amount, any time." />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            {activeTenancy.property_name} · {activeTenancy.unit_number}
          </CardTitle>
          <CardDescription>
            {outstanding > 0
              ? `${formatKes(outstanding)} outstanding`
              : `Rent is up to date · ${formatKes(activeTenancy.monthly_rent)}/month`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-amount">Amount (KES)</Label>
            <Input
              id="pay-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              {outstanding > 0
                ? 'Defaults to your outstanding balance — adjust if you want to pay a different amount.'
                : 'Nothing is due right now. Pay ahead to cover next month’s rent or more.'}
            </p>
          </div>
          <Button
            onClick={handlePay}
            disabled={initiate.isPending || !amount || Number(amount) <= 0}
            className="w-full rounded-xl"
          >
            Pay with Paystack
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
