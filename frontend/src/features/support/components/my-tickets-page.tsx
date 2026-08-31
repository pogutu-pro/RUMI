'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

const ticketSchema = z.object({
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  description: z.string().trim().min(10, 'Please describe the issue in a bit more detail'),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

const EMPTY_TICKET_FORM: TicketFormValues = { subject: '', description: '' };

const replySchema = z.object({
  message: z.string().trim().min(1, 'Reply cannot be empty'),
});

type ReplyFormValues = z.infer<typeof replySchema>;

function TicketThread({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { data: ticket, isLoading } = useTicket(ticketId);
  const addMessage = useAddTicketMessage();

  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '' },
  });

  const handleReply = form.handleSubmit(async (values) => {
    await addMessage.mutateAsync({ ticketId, message: values.message });
    form.reset({ message: '' });
  });

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

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: EMPTY_TICKET_FORM,
  });

  const handleCreate = form.handleSubmit(async (values) => {
    await createTicket.mutateAsync(values);
    setOpen(false);
    form.reset(EMPTY_TICKET_FORM);
  });

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
            <Form {...form}>
              <form onSubmit={handleCreate} className="space-y-3">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Subject</FormLabel>
                      <FormControl>
                        <Input className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Describe the issue</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createTicket.isPending}>
                    Submit
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
