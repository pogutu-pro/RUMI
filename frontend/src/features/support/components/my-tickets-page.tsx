'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { useTickets, useCreateTicket, useTicket, useAddTicketMessage } from '../hooks/use-support';
import type { TicketStatus } from '../types/types';

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

function TicketThread({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { data: ticket, isLoading } = useTicket(ticketId);
  const addMessage = useAddTicketMessage();
  const [reply, setReply] = React.useState('');

  const handleReply = async () => {
    if (!reply.trim()) return;
    await addMessage.mutateAsync({ ticketId, message: reply.trim() });
    setReply('');
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {isLoading || !ticket ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {ticket.subject}
                <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{ticket.description}</p>

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

            <div className="space-y-2 border-t pt-3">
              <Label htmlFor="reply">Reply</Label>
              <Textarea id="reply" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
              <Button onClick={handleReply} disabled={!reply.trim() || addMessage.isPending} className="w-full">
                Send reply
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Shared "my tickets" view used by landlord, caretaker, and tenant dashboards —
 * create a ticket, see its status, reply to it. Full ticket management for
 * tech support lives in its own dashboard.
 */
export function MyTicketsPage() {
  const { data: tickets = [], isLoading } = useTickets();
  const createTicket = useCreateTicket();
  const [open, setOpen] = React.useState(false);
  const [activeTicketId, setActiveTicketId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ subject: '', description: '' });

  const handleCreate = async () => {
    await createTicket.mutateAsync(form);
    setOpen(false);
    setForm({ subject: '', description: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Support</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New support ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Describe the issue</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!form.subject.trim() || !form.description.trim() || createTicket.isPending}
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No support tickets yet.</p>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {tickets.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setActiveTicketId(t.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.subject}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </span>
                <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      {activeTicketId && (
        <TicketThread ticketId={activeTicketId} onClose={() => setActiveTicketId(null)} />
      )}
    </div>
  );
}
