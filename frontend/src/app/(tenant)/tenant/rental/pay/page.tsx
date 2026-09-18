'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PageHeader } from '@/components/dashboard/page-header';
import { useTenancies, useRentBalance, useInitiatePayment } from '@/features/rental/hooks/use-rental';

function formatKes(amount: string | number) {
  const n = Number(amount);
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

type PayOption = 'full' | 'custom';

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
  // The full amount is whatever the landlord set — the outstanding charge
  // when one exists, otherwise the tenancy's own monthly rent. Never
  // editable: this option exists so a tenant can pay exactly what's owed
  // with no risk of typing the wrong figure.
  const fullAmount = outstanding > 0 ? outstanding : Number(activeTenancy?.monthly_rent ?? 0);

  const [option, setOption] = React.useState<PayOption>('full');
  const [customAmount, setCustomAmount] = React.useState('');

  if (tenanciesError || balanceError) {
    return <ErrorState onRetry={() => refetchBalance()} />;
  }

  if (tenanciesLoading || balanceLoading) {
    return <LoadingSkeleton type="card" />;
  }

  if (!activeTenancy) {
    return <p className="text-sm text-muted-foreground">No tenancy on file yet — contact your landlord.</p>;
  }

  const amount = option === 'full' ? fullAmount : Number(customAmount);
  const canPay = amount > 0;

  const handlePay = async () => {
    if (!canPay) return;
    const result = await initiate.mutateAsync({ tenancyId: activeTenancy.id, amount: String(amount) });
    if (result.authorization_url) {
      window.location.href = result.authorization_url;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pay Rent" description="Pay what's due, or pay ahead of time." />

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
          <RadioGroup value={option} onValueChange={(v) => setOption(v as PayOption)} className="space-y-3">
            <label
              htmlFor="pay-full"
              className="flex cursor-pointer items-center justify-between rounded-xl border p-4 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="full" id="pay-full" />
                <div>
                  <p className="text-sm font-medium text-foreground">Pay full amount</p>
                  <p className="text-xs text-muted-foreground">
                    {outstanding > 0 ? 'Your outstanding balance' : 'Your monthly rent'}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatKes(fullAmount)}</p>
            </label>

            <label
              htmlFor="pay-custom"
              className="flex cursor-pointer flex-col gap-3 rounded-xl border p-4 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="custom" id="pay-custom" />
                <div>
                  <p className="text-sm font-medium text-foreground">Pay a different amount</p>
                  <p className="text-xs text-muted-foreground">Pay more to get ahead, or pay part of what&apos;s due</p>
                </div>
              </div>
              {option === 'custom' && (
                <div className="pl-7">
                  <Label htmlFor="custom-amount" className="sr-only">Amount (KES)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter amount in KES"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-11 max-w-xs"
                  />
                </div>
              )}
            </label>
          </RadioGroup>

          <Button
            onClick={handlePay}
            disabled={initiate.isPending || !canPay}
            className="w-full rounded-xl"
          >
            Pay Rent
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
