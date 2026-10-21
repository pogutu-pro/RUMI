'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormDialogActions, FormRow } from '@/components/ui/form-layout';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMoveIn, useUnits } from '@/features/rental/hooks/use-rental';

const today = () => new Date().toISOString().slice(0, 10);

const schema = z
  .object({
    unit: z.string().min(1, 'Choose a unit'),
    full_name: z.string().trim().min(2, 'Enter the tenant’s name').max(255),
    phone: z.string().trim().max(20),
    email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
    national_id: z.string().trim().max(50),
    monthly_rent: z.coerce.number().positive('Enter the monthly rent'),
    deposit: z.coerce.number().min(0, 'Cannot be negative'),
    deposit_handling: z.enum(['invoice', 'already_paid', 'none']),
    start_date: z.string().min(1, 'Choose the move-in date'),
    rent_due_day: z.coerce.number().int().min(1, '1 to 28').max(28, '1 to 28'),
  })
  .refine((v) => v.phone || v.email, { path: ['phone'], message: 'Add a phone number so they get receipts' });

type Input_ = z.input<typeof schema>;
type Output = z.output<typeof schema>;

const blank = (unit = ''): Input_ => ({
  unit, full_name: '', phone: '', email: '', national_id: '', monthly_rent: '', deposit: '',
  deposit_handling: 'invoice', start_date: today(), rent_due_day: 5,
});

/**
 * Move a tenant into a vacant unit in one form: who they are, the rent, the
 * deposit. Creates the tenant and the tenancy together (POST /tenancies/move-in/).
 */
export function MoveInDialog({
  open, onOpenChange, unitId,
}: { open: boolean; onOpenChange: (open: boolean) => void; unitId?: string }) {
  const { data: units = [] } = useUnits();
  const moveIn = useMoveIn();
  const vacant = units.filter((u) => u.status !== 'occupied');
  const form = useForm<Input_, unknown, Output>({ resolver: zodResolver(schema), defaultValues: blank(unitId) });

  React.useEffect(() => {
    if (open) form.reset(blank(unitId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, unitId]);

  // Picking a unit fills in its rent (and the usual one-month deposit).
  const chosen = form.watch('unit');
  React.useEffect(() => {
    const unit = units.find((u) => u.id === chosen);
    if (unit && Number(unit.monthly_rent) > 0) {
      form.setValue('monthly_rent', String(Number(unit.monthly_rent)));
      form.setValue('deposit', String(Number(unit.monthly_rent)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, units]);

  const submit = form.handleSubmit(async (v) => {
    try {
      await moveIn.mutateAsync({
        ...v, monthly_rent: v.monthly_rent.toFixed(2), deposit: v.deposit.toFixed(2), status: 'active',
      });
      onOpenChange(false);
    } catch {
      // toast shown by useMoveIn
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a tenant</DialogTitle>
          <DialogDescription>
            They get their own M-Pesa account number, monthly invoices and a receipt for every payment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} className="space-y-4">
            <FormField control={form.control} name="unit" render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Choose a vacant unit" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {vacant.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.unit_number}{u.property_name ? ` · ${u.property_name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {vacant.length === 0 && <FormDescription>Every unit is let. Add units on the Properties page.</FormDescription>}
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant’s full name</FormLabel>
                <FormControl><Input {...field} className="h-11" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormRow>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} inputMode="tel" placeholder="07XX XXX XXX" className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl><Input {...field} type="email" className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>
            <FormRow>
              <FormField control={form.control} name="monthly_rent" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly rent (KES)</FormLabel>
                  <FormControl><Input {...field} value={field.value as string} type="number" min={0} className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Move-in date</FormLabel>
                  <FormControl><Input {...field} type="date" className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>
            <FormRow>
              <FormField control={form.control} name="deposit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit (KES)</FormLabel>
                  <FormControl><Input {...field} value={field.value as string} type="number" min={0} className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="deposit_handling" render={({ field }) => (
                <FormItem>
                  <FormLabel>The deposit is</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="invoice">Still to be paid</SelectItem>
                      <SelectItem value="already_paid">Already received</SelectItem>
                      <SelectItem value="none">Not tracked here</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>
            <FormRow>
              <FormField control={form.control} name="rent_due_day" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent due on day</FormLabel>
                  <FormControl><Input {...field} value={field.value as number} type="number" min={1} max={28} className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="national_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>ID number (optional)</FormLabel>
                  <FormControl><Input {...field} className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>
            <FormDialogActions submitLabel="Add tenant" isPending={moveIn.isPending} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
