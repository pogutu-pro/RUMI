'use client';

import * as React from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatKes } from '@/features/ledger/lib/format';
import {
  useCancelReview, useDownloadDocument, useGenerateDocument, useNoticeToVacate, useRentReviews, useScheduleReview,
  useTenancyDocuments, useUploadDocument,
} from './hooks';
import type { TenancyDocument } from './types';

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export function documentFilename(doc: TenancyDocument) {
  return doc.generated ? `${doc.title}.pdf` : doc.title;
}

export function DocumentList({ tenancyId }: { tenancyId: string }) {
  const { data: docs = [], isLoading } = useTenancyDocuments(tenancyId);
  const download = useDownloadDocument();
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (docs.length === 0) return <p className="text-sm text-muted-foreground">No documents yet.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {docs.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-2">
          <span>
            {d.title}
            <span className="block text-xs text-muted-foreground">
              {d.kind_label} · {formatDate(d.created_at)}{d.sent_at ? ' · sent' : ''}{!d.visible_to_tenant ? ' · private' : ''}
            </span>
          </span>
          <Button variant="ghost" size="icon" aria-label={`Download ${d.title}`}
            onClick={() => download.mutate({ id: d.id, filename: documentFilename(d) })}>
            <Download className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Lease tab for the landlord's tenancy panel. */
export function LeaseTab({ tenancyId, monthlyRent }: { tenancyId: string; monthlyRent: string }) {
  const generate = useGenerateDocument();
  const upload = useUploadDocument();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [kind, setKind] = React.useState('other');
  const [noticeOpen, setNoticeOpen] = React.useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    form.append('title', file.name);
    form.append('visible_to_tenant', kind === 'id_copy' ? 'false' : 'true');
    upload.mutate({ tenancyId, form });
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" isLoading={generate.isPending} onClick={() => generate.mutate({ tenancyId, kind: 'lease', send: true })}>
          Generate & send lease
        </Button>
        <Button size="sm" variant="outline" onClick={() => setNoticeOpen(true)}>Record notice to vacate</Button>
      </div>
      <div className="flex items-center gap-2">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-40" aria-label="Document type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="lease">Signed lease</SelectItem>
            <SelectItem value="id_copy">ID copy (private)</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={onFile} />
        <Button size="sm" variant="outline" leftIcon={<Upload className="h-4 w-4" />} isLoading={upload.isPending}
          onClick={() => fileRef.current?.click()}>
          Upload
        </Button>
      </div>
      <DocumentList tenancyId={tenancyId} />
      <Separator />
      <RentReviews tenancyId={tenancyId} monthlyRent={monthlyRent} />
      <NoticeDialog tenancyId={tenancyId} open={noticeOpen} onOpenChange={setNoticeOpen} byTenant={false} />
    </div>
  );
}

function RentReviews({ tenancyId, monthlyRent }: { tenancyId: string; monthlyRent: string }) {
  const { data: reviews = [] } = useRentReviews(tenancyId);
  const schedule = useScheduleReview();
  const cancel = useCancelReview();
  const [date, setDate] = React.useState(inDays(60));
  const [percent, setPercent] = React.useState('');
  const [repeat, setRepeat] = React.useState(true);
  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-medium">Rent reviews</h3>
      <p className="text-muted-foreground">Current rent {formatKes(monthlyRent)}. The tenant is told 30 days before a change.</p>
      <div className="grid grid-cols-2 gap-2">
        <Input aria-label="Effective date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input aria-label="Increase percent" type="number" min="0" placeholder="Increase %" value={percent} onChange={(e) => setPercent(e.target.value)} />
      </div>
      <label className="flex items-center gap-2">
        <Checkbox checked={repeat} onCheckedChange={(v) => setRepeat(v === true)} />Repeat every year
      </label>
      <Button size="sm" variant="outline" isLoading={schedule.isPending} disabled={!(Number(percent) > 0)}
        onClick={() => schedule.mutate({ tenancyId, payload: { effective_date: date, increase_percent: percent, repeat_annually: repeat } })}>
        Schedule increase
      </Button>
      <ul className="space-y-1">
        {reviews.map((r) => (
          <li key={r.id} className="flex items-center justify-between">
            <span>
              {formatDate(r.effective_date)} · {r.increase_percent ? `+${Number(r.increase_percent)}%` : formatKes(r.new_monthly_rent)}
              {r.repeat_annually && ' yearly'}
              {r.applied_at ? ` · applied (${formatKes(r.applied_rent)})` : r.cancelled_at ? ' · cancelled' : r.notified_at ? ' · tenant told' : ''}
            </span>
            {!r.applied_at && !r.cancelled_at && (
              <Button variant="ghost" size="sm" onClick={() => cancel.mutate(r.id)}>Cancel</Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NoticeDialog({ tenancyId, open, onOpenChange, byTenant }: {
  tenancyId: string; open: boolean; onOpenChange: (o: boolean) => void; byTenant: boolean;
}) {
  const notice = useNoticeToVacate();
  const [moveOut, setMoveOut] = React.useState(inDays(30));
  const [reason, setReason] = React.useState('');
  React.useEffect(() => { if (open) { setMoveOut(inDays(30)); setReason(''); } }, [open]);
  const submit = async () => {
    await notice.mutateAsync({ tenancyId, moveOut, reason });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{byTenant ? 'Give notice to vacate' : 'Record notice to vacate'}</DialogTitle>
          <DialogDescription>
            Rent is billed up to the move-out date. Most leases need at least one month’s notice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="notice-date">Move-out date</Label>
            <Input id="notice-date" type="date" value={moveOut} min={inDays(1)} onChange={(e) => setMoveOut(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notice-reason">Reason (optional)</Label>
            <Textarea id="notice-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} isLoading={notice.isPending} disabled={!moveOut}>
            {byTenant ? 'Send notice' : 'Save notice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
