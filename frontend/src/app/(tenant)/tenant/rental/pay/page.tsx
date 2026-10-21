'use client';

import * as React from 'react';
import { Check, Copy, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { useTenancies, useRentBalance } from '@/features/rental/hooks/use-rental';
import { usePaybillInstructions } from '@/features/paybill/hooks';
import { formatKes } from '@/features/ledger/lib/format';

/**
 * How to pay rent. Rent goes straight to the landlord's own M-Pesa paybill
 * (or however the landlord collects); RumiaRent never takes the money. The
 * account number is what lets the payment be matched and receipted.
 */
function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy. Write it down instead.');
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-4">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-2xl font-semibold tracking-wide">{value}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default function TenantPayRentPage() {
  const { data: tenancies = [], isLoading: tenanciesLoading, isError: tenanciesError } = useTenancies();
  const { data: balance, isLoading: balanceLoading, isError: balanceError, refetch } = useRentBalance();
  const { data: paybills = [], isLoading: paybillsLoading } = usePaybillInstructions();

  if (tenanciesError || balanceError) return <ErrorState onRetry={() => refetch()} />;
  if (tenanciesLoading || balanceLoading || paybillsLoading) return <LoadingSkeleton type="card" />;

  const tenancy = tenancies.find((t) => t.status === 'active') ?? tenancies[0];
  if (!tenancy) {
    return <p className="text-sm text-muted-foreground">No tenancy on file yet. Contact your landlord.</p>;
  }

  const credit = Number(balance?.credit_total ?? 0);
  const owed = Math.max(Number(balance?.outstanding_total ?? 0) - credit, 0);
  const options = paybills.filter((p) => p.tenancy === tenancy.id);

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader title="Pay rent" description="Pay your landlord directly. Your receipt arrives by SMS and email." />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{tenancy.property_name} · Unit {tenancy.unit_number}</CardTitle>
          <CardDescription>
            {owed > 0
              ? `You owe ${formatKes(owed)}`
              : credit > 0
                ? `You are ${formatKes(credit)} ahead. It will cover your next rent.`
                : `Rent is up to date · ${formatKes(tenancy.monthly_rent)} a month`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {options.length > 0 ? (
            options.map((p) => (
              <div key={`${p.shortcode}-${p.account_number}`} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Smartphone className="h-4 w-4 text-primary" aria-hidden />
                  M-Pesa → Lipa na M-Pesa → {p.shortcode_type === 'till' ? 'Buy Goods and Services' : 'Pay Bill'}
                </div>
                <CopyValue label={p.shortcode_type === 'till' ? 'Till number' : 'Business number'} value={p.shortcode} />
                {p.account_number && <CopyValue label="Account number (yours only)" value={p.account_number} />}
                <p className="text-xs text-muted-foreground">
                  Pays {p.business_name}. Enter the amount{owed > 0 ? ` (${formatKes(owed)})` : ''} and your M-Pesa PIN.
                  Use exactly this account number so your payment is recorded and receipted automatically. If you
                  type it wrong, your landlord can still match it, but it takes longer.
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Your landlord has not added an M-Pesa paybill yet. Pay the way they asked (cash or bank). Once they
              record it here, you get a receipt by SMS and email.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
