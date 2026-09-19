'use client';

import * as React from 'react';
import Link from 'next/link';
import { MessageSquare, Plus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { FormDialogActions, FormStack } from '@/components/ui/form-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/features/auth';
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
                      <FormLabel>Reply</FormLabel>
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

const PROPERTY_CONTACT: Record<string, { who: string; messagesHref: string }> = {
  tenant: { who: 'your caretaker', messagesHref: '/tenant/rental/messages' },
  caretaker: { who: 'the landlord', messagesHref: '/caretaker/rental/messages' },
  landlord: { who: 'your caretaker', messagesHref: '/landlord/rental/messages' },
};

/** Keeps support for the system and sends property problems to the right person. */
function PropertyIssuesNotice() {
  const { user } = useAuth();
  const contact = PROPERTY_CONTACT[user?.role ?? ''];
  if (!contact) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-muted/40 px-5 py-4">
      <MessageSquare className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Support is for problems with RumiaRent itself.</span> For
        anything about the property, like a shower that is not working or a leak, message {contact.who} instead.
      </p>
      <Link
        href={contact.messagesHref}
        className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Open messages
      </Link>
    </div>
  );
}

/**
 * Shared "my tickets" view used by landlord, caretaker, and tenant dashboards —
 * create a ticket, see its status, reply to it. Full ticket management for
 * tech support lives in its own dashboard.
 */
export function MyTicketsPage() {
  const { data: tickets = [], isLoading, isError, refetch } = useTickets();
  const createTicket = useCreateTicket();
  const [open, setOpen] = React.useState(false);
  const [activeTicketId, setActiveTicketId] = React.useState<string | null>(null);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: EMPTY_TICKET_FORM,
  });

  const handleCreate = form.handleSubmit(async (values) => {
    // Support tickets are only for problems with RumiaRent itself; anything
    // about the property goes to the caretaker through Messages.
    await createTicket.mutateAsync({
      subject: values.subject,
      description: values.description,
      category: 'general',
    });
    setOpen(false);
    form.reset(EMPTY_TICKET_FORM);
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Support"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button leftIcon={<Plus className="h-4 w-4" />}>New ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New support ticket</DialogTitle>
                <DialogDescription>
                  Tell the RumiaRent team about a problem with the app or your account. For anything about the property itself, message your caretaker instead.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={handleCreate}>
                  <FormStack>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input className="h-11" placeholder="e.g. Payment went through but my balance did not change" {...field} />
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
                        <FormLabel>Describe the issue</FormLabel>
                        <FormControl>
                          <Textarea rows={5} placeholder="What happened, and when did it start?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormDialogActions submitLabel="Submit ticket" isPending={createTicket.isPending} />
                  </FormStack>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <PropertyIssuesNotice />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : tickets.length === 0 ? (
        <EmptyState
          variant="add"
          title="No requests yet"
          description="Submit a ticket and we'll keep you updated on its status here."
        />
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
