'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useRentBalance, useGenerateRentCharges, useRecordManualPayment, useTenancies,
} from '@/features/rental/hooks/use-rental';
import type { RentCharge } from '@/features/rental/types';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  paid: 'default',
  due: 'secondary',
  partially_paid: 'secondary',
  overdue: 'destructive',
  upcoming: 'secondary',
  waived: 'default',
  disputed: 'destructive',
};

export default function RentPage() {
  const { data: balance, isLoading } = useRentBalance();
  const { data: tenancies = [] } = useTenancies();
  const generate = useGenerateRentCharges();
  const recordPayment = useRecordManualPayment();

  const [activeCharge, setActiveCharge] = React.useState<RentCharge | null>(null);
  const [amount, setAmount] = React.useState('');

  const tenancyIdByCharge = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of balance?.charges ?? []) {
      const tenancy = tenancies.find((t) => t.unit === c.unit && t.tenant === c.tenant);
      if (tenancy) map.set(c.id, tenancy.id);
    }
    return map;
  }, [balance, tenancies]);

  const handleRecord = async () => {
    if (!activeCharge) return;
    const tenancyId = tenancyIdByCharge.get(activeCharge.id);
    if (!tenancyId) return;
    await recordPayment.mutateAsync({
      tenancy: tenancyId,
      amount,
      rent_charge_id: activeCharge.id,
      payment_method: 'cash',
    });
    setActiveCharge(null);
    setAmount('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rent</h1>
        <Button variant="outline" size="sm" onClick={() => generate.mutate()} disabled={generate.isPending}>
          Generate this month&apos;s charges
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:w-1/2">
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-xl font-semibold">KES {balance?.outstanding_total ?? '0.00'}</p>
        </div>
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-xl font-semibold">KES {balance?.overdue_total ?? '0.00'}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (balance?.charges ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Due</TableHead>
              <TableHead>Amount due</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(balance?.charges ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.due_date}</TableCell>
                <TableCell>KES {c.amount_due}</TableCell>
                <TableCell>KES {c.outstanding}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[c.status] ?? 'secondary'}>{c.status}</Badge></TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => { setActiveCharge(c); setAmount(c.outstanding); }}>
                    Record payment
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!activeCharge} onOpenChange={(o) => !o && setActiveCharge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="amount">Amount received (KES)</Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleRecord} disabled={!amount || recordPayment.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
