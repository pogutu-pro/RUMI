'use client';

import * as React from 'react';
import { Plus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/dashboard/page-header';
import { useProperties } from '@/features/rental/hooks/use-rental';
import { useCreateExpense, useExpenses, useVoidExpense } from '@/features/accounting/hooks';
import type { Expense, ExpenseCategory } from '@/features/accounting/types';
import { formatDate, formatKes } from '@/features/ledger/lib/format';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'repairs', label: 'Repairs and maintenance' },
  { value: 'utilities', label: 'Utilities (paid by you)' },
  { value: 'security_cleaning', label: 'Security and cleaning' },
  { value: 'management_fees', label: 'Management fees' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'rates_taxes', label: 'Land rates and taxes' },
  { value: 'other', label: 'Other' },
];
const NONE = 'none';

export default function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const [adding, setAdding] = React.useState(false);
  const [voiding, setVoiding] = React.useState<Expense | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses"
        description="Costs you pay for your properties. They appear on your monthly statement."
        action={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add expense</Button>}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{formatDate(e.expense_date)}</TableCell>
                  <TableCell>{e.property_name || 'All properties'}</TableCell>
                  <TableCell>{e.category_label}</TableCell>
                  <TableCell>
                    {e.description}
                    {e.supplier && <span className="block text-xs text-muted-foreground">{e.supplier}</span>}
                  </TableCell>
                  <TableCell className="text-right">{formatKes(e.amount)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label="Void expense" title="Void expense" onClick={() => setVoiding(e)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AddExpenseDialog open={adding} onOpenChange={setAdding} />
      <VoidDialog expense={voiding} onClose={() => setVoiding(null)} />
    </div>
  );
}

function AddExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: properties = [] } = useProperties();
  const create = useCreateExpense();
  const blank = {
    property: NONE, category: 'repairs' as ExpenseCategory, description: '', supplier: '', amount: '',
    expense_date: new Date().toISOString().slice(0, 10), paid_from: 'cash' as Expense['paid_from'], reference: '',
  };
  const [form, setForm] = React.useState(blank);
  React.useEffect(() => {
    if (open) setForm({ ...blank, expense_date: new Date().toISOString().slice(0, 10) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    await create.mutateAsync({ ...form, property: form.property === NONE ? null : form.property });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>Recorded in your books and shown on the month’s statement.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Property</Label>
            <Select value={form.property} onValueChange={(v) => set({ property: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>All properties</SelectItem>
                {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set({ category: v as ExpenseCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="ex-desc">Description</Label>
            <Input id="ex-desc" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. Fixed roof leak, block B" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ex-amount">Amount (KES)</Label>
            <Input id="ex-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set({ amount: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ex-date">Date</Label>
            <Input id="ex-date" type="date" value={form.expense_date} onChange={(e) => set({ expense_date: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Paid from</Label>
            <Select value={form.paid_from} onValueChange={(v) => set({ paid_from: v as Expense['paid_from'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank</SelectItem>
                <SelectItem value="mpesa_paybill">M-Pesa</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ex-supplier">Supplier (optional)</Label>
            <Input id="ex-supplier" value={form.supplier} onChange={(e) => set({ supplier: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} isLoading={create.isPending} disabled={!form.description.trim() || !(Number(form.amount) > 0)}>
            Save expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VoidDialog({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const voidExpense = useVoidExpense();
  const [reason, setReason] = React.useState('');
  React.useEffect(() => setReason(''), [expense]);
  const submit = async () => {
    if (!expense) return;
    await voidExpense.mutateAsync({ id: expense.id, reason });
    onClose();
  };
  return (
    <Dialog open={!!expense} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void this expense?</DialogTitle>
          <DialogDescription>
            {expense?.description} · {formatKes(expense?.amount)}. It is reversed in your books (kept for the record).
          </DialogDescription>
        </DialogHeader>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, e.g. entered twice" />
        <DialogFooter>
          <Button variant="destructive" onClick={submit} isLoading={voidExpense.isPending} disabled={!reason.trim()}>
            Void expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
