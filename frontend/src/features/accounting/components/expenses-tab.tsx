'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Ban, FileText, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { SimplePager } from '@/components/ui/simple-pager';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialogActions, FormRow } from '@/components/ui/form-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProperties } from '@/features/rental/hooks/use-rental';
import { useExpenses, useSaveExpense, useVoidExpense } from '../hooks/use-accounting';
import { currentMonthKey, dateLabel, kes } from '../format';
import { EXPENSE_CATEGORIES, EXPENSE_PAID_FROM, type Expense } from '../types';
import { MonthNav } from './month-nav';

const PAGE_SIZE = 20; // matches the server

const NO_PROPERTY = 'none';

const schema = z.object({
  amount: z.coerce.number().positive('Enter an amount greater than 0'),
  category: z.enum(['repairs', 'utilities', 'caretaker', 'security', 'cleaning', 'insurance', 'land_rates', 'agent_fees', 'other']),
  incurred_on: z.string().min(1, 'Choose the date').refine((d) => d <= new Date().toISOString().slice(0, 10), 'The date cannot be in the future'),
  property: z.string(),
  paid_from: z.enum(['cash', 'bank_transfer', 'mpesa_paybill', 'other']),
  vendor: z.string().trim().max(150),
  description: z.string().trim().max(300),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);

function ExpenseDialog({ expense, open, onClose }: { expense: Expense | null; open: boolean; onClose: () => void }) {
  const { data: properties = [] } = useProperties();
  const save = useSaveExpense();
  const [receipt, setReceipt] = React.useState<File | null>(null);
  const [serverError, setServerError] = React.useState('');
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', category: 'repairs', incurred_on: today(), property: NO_PROPERTY, paid_from: 'cash', vendor: '', description: '' },
  });

  React.useEffect(() => {
    if (!open) return;
    setReceipt(null);
    setServerError('');
    form.reset(
      expense
        ? {
            amount: String(Number(expense.amount)), category: expense.category, incurred_on: expense.incurred_on,
            property: expense.property ?? NO_PROPERTY, paid_from: expense.paid_from ?? 'cash',
            vendor: expense.vendor, description: expense.description,
          }
        : { amount: '', category: 'repairs', incurred_on: today(), property: NO_PROPERTY, paid_from: 'cash', vendor: '', description: '' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense]);

  const submit = form.handleSubmit(async (v) => {
    setServerError('');
    try {
      await save.mutateAsync({
        id: expense?.id,
        input: {
          amount: String(v.amount), category: v.category, incurred_on: v.incurred_on,
          property: v.property === NO_PROPERTY ? '' : v.property, paid_from: v.paid_from,
          vendor: v.vendor, description: v.description, receipt,
        },
      });
      onClose();
    } catch (err) {
      setServerError((err as { message?: string })?.message || 'Could not save the expense');
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Add an expense'}</DialogTitle>
          <DialogDescription>Money you spent running a property. It shows in your monthly summary and exports.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} className="space-y-5">
            <FormRow>
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES)</FormLabel>
                  <FormControl><Input className="h-11" type="number" inputMode="decimal" min="0" step="any" placeholder="e.g. 2500" {...field} value={field.value as string | number} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="incurred_on" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input className="h-11" type="date" max={today()} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>

            <FormRow>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="property" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NO_PROPERTY}>General (no property)</SelectItem>
                      {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>

            <FormField control={form.control} name="paid_from" render={({ field }) => (
              <FormItem>
                <FormLabel>Paid from</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {EXPENSE_PAID_FROM.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormDescription>Keeps your cash, bank and M-Pesa balances right.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="vendor" render={({ field }) => (
              <FormItem>
                <FormLabel>Paid to (optional)</FormLabel>
                <FormControl><Input className="h-11" placeholder="e.g. Fundi Joe, KPLC" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>What it was for (optional)</FormLabel>
                <FormControl><Textarea rows={2} placeholder="e.g. Fixed the leaking kitchen tap in A101" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="space-y-1.5">
              <label htmlFor="expense-receipt" className="text-sm font-medium">Receipt (optional)</label>
              <Input
                id="expense-receipt" className="h-11 cursor-pointer" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                A photo or PDF up to 5 MB.{expense?.receipt_url && !receipt ? ' A receipt is already attached; choose a file to replace it.' : ''}
              </p>
            </div>

            {serverError && <p role="alert" className="text-sm font-medium text-destructive">{serverError}</p>}
            <FormDialogActions submitLabel={expense ? 'Save changes' : 'Save expense'} isPending={save.isPending} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function VoidDialog({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const remove = useVoidExpense();
  const [reason, setReason] = React.useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense || !reason.trim()) return;
    try {
      await remove.mutateAsync({ id: expense.id, reason: reason.trim() });
      setReason('');
      onClose();
    } catch {
      // the hook shows the error
    }
  };

  return (
    <Dialog open={!!expense} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this expense?</DialogTitle>
          <DialogDescription>
            It stops counting in your totals. Your books keep a record that it existed and why it was removed, so nothing
            is silently erased.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="void-reason" className="text-sm font-medium">Why is it being removed?</label>
            <Input id="void-reason" className="h-11" maxLength={300} placeholder="e.g. Entered twice" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <FormDialogActions submitLabel="Remove expense" isPending={remove.isPending} disabled={!reason.trim()} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ExpensesTab() {
  const [month, setMonth] = React.useState(currentMonthKey());
  const [pageState, setPageState] = React.useState({ key: month, page: 1 });
  const page = pageState.key === month ? pageState.page : 1;
  const { data, isLoading } = useExpenses(month, page);
  const [editing, setEditing] = React.useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null });
  const [voiding, setVoiding] = React.useState<Expense | null>(null);
  const rows = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNav month={month} onChange={setMonth} />
        <Button onClick={() => setEditing({ open: true, expense: null })} leftIcon={<Plus className="h-4 w-4" />}>Add expense</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState variant="add" title="No expenses this month" description="Record what you spend on repairs, utilities, security and the like to see your real profit." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{dateLabel(e.incurred_on)}</TableCell>
                  <TableCell>
                    <p className="font-medium">{e.category_label}</p>
                    <p className="text-xs text-muted-foreground">{e.property_name || 'General'}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {[e.vendor, e.description].filter(Boolean).join(' · ') || '—'}
                    {e.receipt_url && (
                      <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary underline">
                        <FileText className="h-3.5 w-3.5" aria-hidden /> Receipt
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{kes(e.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Edit expense" onClick={() => setEditing({ open: true, expense: e })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Remove expense" onClick={() => setVoiding(e)}><Ban className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
      <SimplePager page={page} pageSize={PAGE_SIZE} total={data?.count ?? 0} onPageChange={(next) => setPageState({ key: month, page: next })} />

      <ExpenseDialog expense={editing.expense} open={editing.open} onClose={() => setEditing((s) => ({ ...s, open: false }))} />
      <VoidDialog expense={voiding} onClose={() => setVoiding(null)} />
    </div>
  );
}
