'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils/cn';
import { useTickets, useTicket, useUpdateTicket, useAddTicketMessage } from '@/features/support/hooks/use-support';
import type { TicketStatus } from '@/features/support/types/types';

const replySchema = z.object({
  message: z.string().trim().min(1, 'Reply cannot be empty'),
});

type ReplyFormData = z.infer<typeof replySchema>;

const STATUS_VARIANT: Record<TicketStatus, 'default' | 'secondary' | 'destructive'> = {
  open: 'destructive',
  in_progress: 'secondary',
  resolved: 'default',
  closed: 'secondary',
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const FILTERS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

function TicketDetailDialog({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { data: ticket, isLoading } = useTicket(ticketId);
  const updateTicket = useUpdateTicket();
  const addMessage = useAddTicketMessage();

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '' },
  });

  const handleReply = form.handleSubmit(async (values) => {
    await addMessage.mutateAsync({ ticketId, message: values.message });
    form.reset();
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {isLoading || !ticket ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{ticket.subject}</DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {ticket.created_by_name} · {ticket.created_by_role}
              </span>
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm">{ticket.description}</p>

            <div className="flex items-center gap-2 border-t pt-3">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={ticket.status}
                onValueChange={(value) => updateTicket.mutate({ id: ticket.id, payload: { status: value as TicketStatus } })}
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border-t pt-3">
              {ticket.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              ) : (
                ticket.messages.map((m) => (
                  <div key={m.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{m.author_name}</span>
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p>{m.message}</p>
                  </div>
                ))
              )}
            </div>

            <Form {...form}>
              <form onSubmit={handleReply} className="space-y-2 border-t pt-3">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Reply</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={addMessage.isPending} className="w-full">
                  Send reply
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TechSupportDashboard() {
  const [filter, setFilter] = React.useState<TicketStatus | 'all'>('all');
  const { data: tickets = [], isLoading } = useTickets(filter === 'all' ? undefined : filter);
  const [activeTicketId, setActiveTicketId] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Support tickets</h1>

      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets here.</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-background">
          {tickets.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setActiveTicketId(t.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.subject}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.created_by_name} · {t.created_by_role} · {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </span>
                <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      {activeTicketId && (
        <TicketDetailDialog ticketId={activeTicketId} onClose={() => setActiveTicketId(null)} />
      )}
    </div>
  );
}
