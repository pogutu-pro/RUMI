'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialogActions, FormRow } from '@/components/ui/form-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRecordManualPayment } from '@/features/rental/hooks/use-rental';
import type { Tenancy } from '@/features/rental/types';

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'M-Pesa / other' },
] as const;

const schema = z.object({
  tenancy: z.string().min(1, 'Choose a tenant'),
  amount: z.coerce.number().positive('Enter an amount greater than 0'),
  payment_method: z.enum(['cash', 'bank_transfer', 'other']),
  notes: z.string().trim().max(500),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tenancies the signed-in user may record against. */
  tenancies: Tenancy[];
  /** Pre-select a tenancy (e.g. when opened from a specific rent charge). */
  defaultTenancyId?: string;
  /** Pre-fill the amount (e.g. the charge's outstanding balance). */
  defaultAmount?: number;
  /** Pin the payment to one charge instead of settling the oldest first. */
  rentChargeId?: string;
}

/**
 * Record rent received outside the app - cash handed over, a bank transfer,
 * or M-Pesa paid straight to the landlord. Used by landlords and by
 * caretakers who have been given the permission.
 */
export function RecordPaymentDialog({
  open,
  onOpenChange,
  tenancies,
  defaultTenancyId,
  defaultAmount,
  rentChargeId,
}: RecordPaymentDialogProps) {
  const record = useRecordManualPayment();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { tenancy: '', amount: '', payment_method: 'cash', notes: '' },
  });

  // Re-seed each time the dialog opens so a previous entry never leaks in.
  React.useEffect(() => {
    if (!open) return;
    form.reset({
      tenancy: defaultTenancyId ?? (tenancies.length === 1 ? tenancies[0].id : ''),
      amount: defaultAmount && defaultAmount > 0 ? String(defaultAmount) : '',
      payment_method: 'cash',
      notes: '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultTenancyId, defaultAmount]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await record.mutateAsync({
        tenancy: values.tenancy,
        amount: String(values.amount),
        payment_method: values.payment_method,
        ...(values.notes ? { notes: values.notes } : {}),
        ...(rentChargeId ? { rent_charge_id: rentChargeId } : {}),
      });
      onOpenChange(false);
    } catch {
      // the hook already surfaced the error as a toast; keep the dialog open
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            Rent received in cash, by bank transfer or directly by M-Pesa. It settles the oldest unpaid
            charge first, and the tenant is notified.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormField
              control={form.control}
              name="tenancy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!defaultTenancyId}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose the tenant who paid" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenancies.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.tenant_name} · {t.property_name} {t.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormRow>
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
                        inputMode="decimal"
                        min="0"
                        step="any"
                        placeholder="e.g. 22000"
                        {...field}
                        value={field.value as string | number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received by</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="Receipt number or M-Pesa code" {...field} />
                  </FormControl>
                  <FormDescription>Kept on the payment record for your own reference.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormDialogActions submitLabel="Record payment" isPending={record.isPending} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
