'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/dashboard/page-header';
import { useAddCaseNote, useArrears, useGenerateDocument, useOpenCase, useStaff, useUpdateCase } from '@/features/leasing/hooks';
import type { ArrearsRow, DebtStatus } from '@/features/leasing/types';
import { formatDate, formatKes } from '@/features/ledger/lib/format';

const STATUS_LABEL: Record<DebtStatus, string> = {
  open: 'Following up', promised: 'Promised to pay', escalated: 'Escalated', closed: 'Closed',
};
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export default function DebtRecoveryPage() {
  const { data: rows = [], isLoading } = useArrears();
  const [openTenancy, setOpenTenancy] = React.useState<string | null>(null);
  const row = rows.find((r) => r.tenancy === openTenancy) ?? null;
  const total = rows.reduce((sum, r) => sum + Number(r.arrears), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Debt recovery"
        description={`Tenants with overdue balances — ${formatKes(total)} in total. Reminders go out automatically; use this for follow-up.`}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody is in arrears.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead className="text-right">Overdue</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Assigned to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.tenancy} className="cursor-pointer" onClick={() => setOpenTenancy(r.tenancy)}>
                <TableCell>{r.tenant_name}<span className="block text-xs text-muted-foreground">{r.unit_number} · {r.property_name}</span></TableCell>
                <TableCell className="text-right font-medium text-destructive">{formatKes(r.arrears)}</TableCell>
                <TableCell>
                  {r.case ? <Badge variant={r.case.status === 'escalated' ? 'destructive' : 'secondary'}>{STATUS_LABEL[r.case.status]}</Badge>
                    : <span className="text-xs text-muted-foreground">No case</span>}
                  {r.case?.promise_date && <span className="block text-xs text-muted-foreground">promised {formatDate(r.case.promise_date)}</span>}
                </TableCell>
                <TableCell>{r.case?.assigned_to_name ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <CaseSheet row={row} onClose={() => setOpenTenancy(null)} />
    </div>
  );
}

function CaseSheet({ row, onClose }: { row: ArrearsRow | null; onClose: () => void }) {
  const { data: staff = [] } = useStaff();
  const openCase = useOpenCase();
  const update = useUpdateCase();
  const addNote = useAddCaseNote();
  const generate = useGenerateDocument();
  const [note, setNote] = React.useState('');
  const [assignee, setAssignee] = React.useState<string>('');
  const [promise, setPromise] = React.useState(inDays(7));
  const [quitOpen, setQuitOpen] = React.useState(false);
  const c = row?.case ?? null;
  React.useEffect(() => { setNote(''); setAssignee(c?.assigned_to ? String(c.assigned_to) : ''); }, [row?.tenancy, c?.assigned_to]);

  return (
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {row && (
          <div className="space-y-4 text-sm">
            <SheetHeader>
              <SheetTitle>{row.tenant_name} · {row.unit_number}</SheetTitle>
              <SheetDescription>Overdue {formatKes(row.arrears, { cents: true })} · {row.phone}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" isLoading={generate.isPending && generate.variables?.kind === 'demand_note'}
                onClick={() => generate.mutate({ tenancyId: row.tenancy, kind: 'demand_note', pay_within_days: 7, send: true })}>
                Send demand note
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setQuitOpen(true)}>Notice to quit…</Button>
            </div>

            <div className="space-y-1">
              <Label>Assigned to</Label>
              <Select value={assignee} onValueChange={(v) => {
                setAssignee(v);
                if (c) update.mutate({ id: c.id, payload: { assigned_to: Number(v) } });
              }}>
                <SelectTrigger><SelectValue placeholder="Choose who follows up" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {!c ? (
              <div className="space-y-2">
                <Textarea rows={2} placeholder="First note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button size="sm" isLoading={openCase.isPending} onClick={() => openCase.mutate({
                  tenancy: row.tenancy, assigned_to: assignee ? Number(assignee) : null, note,
                })}>Open debt case</Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="promise">Promised by</Label>
                    <Input id="promise" type="date" value={promise} onChange={(e) => setPromise(e.target.value)} className="w-40" />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => update.mutate({ id: c.id, payload: { status: 'promised', promise_date: promise } })}>
                    Record promise
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => update.mutate({ id: c.id, payload: { status: 'escalated' } })}>Escalate</Button>
                  <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: c.id, payload: { status: 'closed', closed_reason: 'Closed by landlord' } })}>
                    Close
                  </Button>
                </div>
                <div className="space-y-2">
                  <Textarea rows={2} placeholder="What happened? e.g. Called, will pay Friday" value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button size="sm" disabled={!note.trim()} isLoading={addNote.isPending}
                    onClick={async () => { await addNote.mutateAsync({ id: c.id, text: note }); setNote(''); }}>Add note</Button>
                </div>
                <ul className="space-y-2">
                  {[...c.notes].reverse().map((n, i) => (
                    <li key={i} className="rounded-md border p-2">
                      {n.text}
                      <span className="block text-xs text-muted-foreground">{n.author} · {formatDate(n.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <QuitDialog tenancyId={row.tenancy} open={quitOpen} onOpenChange={setQuitOpen} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function QuitDialog({ tenancyId, open, onOpenChange }: { tenancyId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const generate = useGenerateDocument();
  const [vacateBy, setVacateBy] = React.useState(inDays(30));
  const [reason, setReason] = React.useState('');
  const submit = async () => {
    await generate.mutateAsync({ tenancyId, kind: 'quit_notice', vacate_by: vacateBy, reason, send: true });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notice to quit</DialogTitle>
          <DialogDescription>
            Sent to the tenant by email and SMS and kept in their documents. Check the notice period your lease and the
            law require before sending.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="quit-date">Vacate by</Label>
            <Input id="quit-date" type="date" value={vacateBy} min={inDays(1)} onChange={(e) => setVacateBy(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quit-reason">Reason (defaults to the unpaid balance)</Label>
            <Textarea id="quit-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={submit} isLoading={generate.isPending}>Send notice to quit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
