'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/dashboard/page-header';
import { axiosInstance as axios } from '@/lib/api/client';
import { useProperties } from '@/features/rental/hooks/use-rental';
import { apiErrorMessage, formatDate } from '@/features/ledger/lib/format';

interface BroadcastPayload {
  audience: 'all_tenants' | 'property' | 'arrears';
  property?: string;
  send_sms: boolean;
  send_email: boolean;
  subject: string;
  message: string;
}
interface Preview { recipients: number; with_phone: number; with_email: number; sms_segments: number; samples: string[]; unknown_placeholders: string[] }
interface Broadcast extends BroadcastPayload { id: string; status: string; recipients: number; sms_sent: number; emails_sent: number; failures: number; created_at: string }

const AUDIENCE = { all_tenants: 'All current tenants', property: 'Tenants of one property', arrears: 'Tenants with overdue balances' };
const CHIPS = [['{name}', 'First name'], ['{unit}', 'Unit'], ['{balance}', 'Overdue balance'], ['{account}', 'M-Pesa account no.']];
const TEMPLATES = [
  ['Water interruption', 'Dear {name}, water will be off on Saturday 9am–1pm for tank cleaning. Sorry for the inconvenience.'],
  ['Arrears reminder', 'Dear {name}, unit {unit} has an overdue balance of {balance}. Pay via M-Pesa, account {account}. Thank you.'],
  ['General notice', 'Dear {name}, '],
];

export default function MessagesPage() {
  const qc = useQueryClient();
  const { data: properties = [] } = useProperties();
  const { data: history = [] } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => (await axios.get<Broadcast[]>('/broadcasts/')).data,
    refetchInterval: 15_000,
  });
  const [form, setForm] = React.useState<BroadcastPayload>({
    audience: 'all_tenants', send_sms: true, send_email: false, subject: '', message: '',
  });
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const set = (patch: Partial<BroadcastPayload>) => setForm((f) => ({ ...f, ...patch }));
  const payload = { ...form, property: form.audience === 'property' ? form.property : undefined };
  const ready = form.message.trim().length >= 5 && (form.send_sms || form.send_email) && (form.audience !== 'property' || !!form.property);

  const preview = useQuery({
    queryKey: ['broadcast-preview', payload],
    queryFn: async () => (await axios.post<Preview>('/broadcasts/', { ...payload, preview: true })).data,
    enabled: ready,
  });
  const send = useMutation({
    mutationFn: async () => (await axios.post('/broadcasts/', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcasts'] });
      toast.success('Sending — you can follow progress below');
      set({ message: '', subject: '' });
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not send')),
  });

  const insert = (token: string) => {
    const el = ref.current;
    const at = el?.selectionStart ?? form.message.length;
    set({ message: form.message.slice(0, at) + token + form.message.slice(at) });
    requestAnimationFrame(() => el?.focus());
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Send an SMS or email to your tenants — notices, reminders, announcements." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">New message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Send to</Label>
                <Select value={form.audience} onValueChange={(v) => set({ audience: v as BroadcastPayload['audience'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AUDIENCE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.audience === 'property' && (
                <div className="space-y-1">
                  <Label>Property</Label>
                  <Select value={form.property ?? ''} onValueChange={(v) => set({ property: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose property" /></SelectTrigger>
                    <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2"><Checkbox checked={form.send_sms} onCheckedChange={(v) => set({ send_sms: v === true })} />SMS</label>
              <label className="flex items-center gap-2"><Checkbox checked={form.send_email} onCheckedChange={(v) => set({ send_email: v === true })} />Email</label>
            </div>
            {form.send_email && (
              <div className="space-y-1">
                <Label htmlFor="msg-subject">Email subject</Label>
                <Input id="msg-subject" value={form.subject} onChange={(e) => set({ subject: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="msg-body">Message</Label>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATES.map(([label, text]) => (
                    <Button key={label} type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => set({ message: text })}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea id="msg-body" ref={ref} rows={5} value={form.message} onChange={(e) => set({ message: e.target.value })}
                placeholder="Write your message…" />
              <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                Personalise:
                {CHIPS.map(([token, label]) => (
                  <button key={token} type="button" onClick={() => insert(token)}
                    className="rounded-full border px-2 py-0.5 font-mono hover:bg-muted" title={label}>{token}</button>
                ))}
                <span className="ml-auto tabular-nums">{form.message.length} characters</span>
              </div>
            </div>
            <Button leftIcon={<Send className="h-4 w-4" />} disabled={!ready || !preview.data?.recipients}
              isLoading={send.isPending} onClick={() => send.mutate()}>
              Send to {preview.data?.recipients ?? 0} {preview.data?.recipients === 1 ? 'tenant' : 'tenants'}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-fit rounded-2xl">
          <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!ready ? <p className="text-muted-foreground">Write a message to see who gets it and what it looks like.</p> :
              preview.isLoading ? <p className="text-muted-foreground">Counting…</p> : preview.data && (
                <>
                  <dl className="grid grid-cols-2 gap-2">
                    <div><dt className="text-xs text-muted-foreground">Recipients</dt><dd className="text-lg font-semibold">{preview.data.recipients}</dd></div>
                    {form.send_sms && <div><dt className="text-xs text-muted-foreground">SMS (160-char parts)</dt><dd className="text-lg font-semibold">{preview.data.sms_segments}</dd></div>}
                  </dl>
                  {form.send_sms && preview.data.with_phone < preview.data.recipients && (
                    <p className="text-xs text-warning">{preview.data.recipients - preview.data.with_phone} have no phone number.</p>
                  )}
                  {preview.data.unknown_placeholders.length > 0 && (
                    <p className="text-xs text-destructive">Unknown: {preview.data.unknown_placeholders.map((p) => `{${p}}`).join(', ')} — will be sent as typed.</p>
                  )}
                  {preview.data.samples.map((sample, i) => (
                    <div key={i} className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2">{sample}</div>
                  ))}
                </>
              )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 font-medium">Sent</h2>
        {history.length === 0 ? <p className="text-sm text-muted-foreground">Nothing sent yet.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>To</TableHead><TableHead>Message</TableHead><TableHead>Delivered</TableHead></TableRow></TableHeader>
            <TableBody>
              {history.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(b.created_at)}</TableCell>
                  <TableCell>{AUDIENCE[b.audience]}</TableCell>
                  <TableCell className="max-w-xs truncate">{b.message}</TableCell>
                  <TableCell>
                    {b.status === 'sent' ? (
                      <span className="text-sm">{b.sms_sent} SMS · {b.emails_sent} email{b.failures ? <span className="text-destructive"> · {b.failures} failed</span> : ''}</span>
                    ) : <Badge variant="secondary">{b.status}</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
