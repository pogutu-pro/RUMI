'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Enter an amount greater than 0'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function RentPage() {
  const { data: balance, isLoading } = useRentBalance();
  const { data: tenancies = [] } = useTenancies();
  const generate = useGenerateRentCharges();
  const recordPayment = useRecordManualPayment();

  const [activeCharge, setActiveCharge] = React.useState<RentCharge | null>(null);

  const tenancyIdByCharge = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of balance?.charges ?? []) {
      const tenancy = tenancies.find((t) => t.unit === c.unit && t.tenant === c.tenant);
      if (tenancy) map.set(c.id, tenancy.id);
    }
    return map;
  }, [balance, tenancies]);

  const form = useForm<z.input<typeof paymentSchema>, unknown, PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    values: { amount: activeCharge?.outstanding ? Number(activeCharge.outstanding) : 0 },
  });

  const handleRecord = form.handleSubmit(async (values) => {
    if (!activeCharge) return;
    const tenancyId = tenancyIdByCharge.get(activeCharge.id);
    if (!tenancyId) return;
    await recordPayment.mutateAsync({
      tenancy: tenancyId,
      amount: String(values.amount),
      rent_charge_id: activeCharge.id,
      payment_method: 'cash',
    });
    setActiveCharge(null);
  });

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
                  <Button size="sm" onClick={() => setActiveCharge(c)}>
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
            <DialogDescription>
              {activeCharge
                ? `Record cash or bank money received for the charge due ${activeCharge.due_date}. KES ${activeCharge.outstanding} is outstanding.`
                : 'Record cash or bank money received for this charge.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount received (KES)</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="number"
                      placeholder="0"
                      {...field}
                      value={field.value as number | string}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={recordPayment.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleRecord} isLoading={recordPayment.isPending} disabled={recordPayment.isPending}>
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
