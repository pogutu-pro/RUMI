'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Tenancy } from '@/features/rental/types';
import { useCreateAdhocInvoice } from '../hooks/use-ledger';
import { EXTRA_LINE_TYPES, LINE_TYPE_LABEL, formatKes } from '../lib/format';
import type { ExtraLineType } from '../types';

interface DraftLine {
  line_type: ExtraLineType;
  description: string;
  unit_price: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export function AdhocInvoiceDialog({
  open,
  onOpenChange,
  tenancies,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancies: Tenancy[];
}) {
  const create = useCreateAdhocInvoice();
  const [tenancy, setTenancy] = React.useState('');
  const [dueDate, setDueDate] = React.useState(today());
  const [lines, setLines] = React.useState<DraftLine[]>([{ line_type: 'repair', description: '', unit_price: '' }]);

  React.useEffect(() => {
    if (open) {
      setTenancy('');
      setDueDate(today());
      setLines([{ line_type: 'repair', description: '', unit_price: '' }]);
    }
  }, [open]);

  const billable = tenancies.filter((t) => ['active', 'notice_period'].includes(t.status));
  const total = lines.reduce((sum, l) => sum + (Number(l.unit_price) || 0), 0);
  const valid = tenancy && dueDate && lines.every((l) => Number(l.unit_price) > 0);

  const update = (index: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const submit = async () => {
    await create.mutateAsync({
      tenancy,
      due_date: dueDate,
      lines: lines.map((l) => ({ line_type: l.line_type, description: l.description, unit_price: l.unit_price })),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New charge</DialogTitle>
          <DialogDescription>A one-off invoice, e.g. a repair or a utility top-up. It appears on the tenant’s dashboard.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Tenant</Label>
              <Select value={tenancy} onValueChange={setTenancy}>
                <SelectTrigger><SelectValue placeholder="Choose tenancy" /></SelectTrigger>
                <SelectContent>
                  {billable.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.tenant_name} · {t.unit_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="adhoc-due">Due date</Label>
              <Input id="adhoc-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_7rem_auto] items-center gap-2">
                <Select value={line.line_type} onValueChange={(v) => update(index, { line_type: v as ExtraLineType })}>
                  <SelectTrigger aria-label="Item type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXTRA_LINE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{LINE_TYPE_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  aria-label="Description"
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) => update(index, { description: e.target.value })}
                />
                <Input
                  aria-label="Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="KES"
                  value={line.unit_price}
                  onChange={(e) => update(index, { unit_price: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove item"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setLines((prev) => [...prev, { line_type: 'other', description: '', unit_price: '' }])}
            >
              Add item
            </Button>
          </div>
          <p className="text-right text-sm font-medium">Total {formatKes(total, { cents: true })}</p>
        </div>
        <DialogFooter>
          <Button onClick={submit} isLoading={create.isPending} disabled={!valid}>
            Create invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
