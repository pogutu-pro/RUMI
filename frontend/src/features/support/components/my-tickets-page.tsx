'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTickets, useCreateTicket, useTicket, useAddTicketMessage } from '../hooks/use-support';
import { useTenancies } from '@/features/rental/hooks/use-rental';
import type { TicketStatus, TicketCategory, TicketPriority } from '../types/types';

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

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  general: 'General',
  maintenance: 'Maintenance',
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const ticketSchema = z
  .object({
    subject: z.string().trim().min(3, 'Subject is required').max(200),
    description: z.string().trim().min(10, 'Please describe the issue in a bit more detail'),
    category: z.enum(['general', 'maintenance']),
    unit: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.category === 'maintenance' && !values.unit) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['unit'], message: 'Choose a unit' });
    }
  });

type TicketFormValues = z.infer<typeof ticketSchema>;

const EMPTY_TICKET_FORM: TicketFormValues = {
  subject: '', description: '', category: 'general', unit: undefined, priority: undefined,
};

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
  const { data: tickets = [], isLoading, isError, refetch } = useTickets();
  const { data: tenancies = [] } = useTenancies();
  const createTicket = useCreateTicket();
  const [open, setOpen] = React.useState(false);
  const [activeTicketId, setActiveTicketId] = React.useState<string | null>(null);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: EMPTY_TICKET_FORM,
  });

  // react-hook-form's watch() returns a function that cannot be memoized
  // safely, so React Compiler skips auto-memoizing this component — a known,
  // accepted library-level limitation (not a bug), and this file's only use
  // of the pattern (see 05-PATTERNS.md: no existing analog for conditional
  // form fields prior to this).
  // eslint-disable-next-line react-hooks/incompatible-library
  const category = form.watch('category');

  // Unit choices sourced from the tenant's own tenancies (already
  // tenant-scoped server-side) — deliberately not from the org-wide units
  // list, which would leak other tenants' unit numbers within the same org.
  const unitChoices = React.useMemo(() => {
    const seen = new Set<string>();
    const choices: { id: string; label: string }[] = [];
    for (const t of tenancies) {
      if (!seen.has(t.unit)) {
        seen.add(t.unit);
        choices.push({ id: t.unit, label: t.unit_number });
      }
    }
    return choices;
  }, [tenancies]);

  const handleCreate = form.handleSubmit(async (values) => {
    await createTicket.mutateAsync({
      subject: values.subject,
      description: values.description,
      category: values.category,
      ...(values.category === 'maintenance' ? { unit: values.unit, priority: values.priority } : {}),
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
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Object.keys(CATEGORY_LABEL) as TicketCategory[]).map((c) => (
                              <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {category === 'maintenance' && (
                    <>
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select a unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {unitChoices.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select a priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
                                  <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={createTicket.isPending}>
                      Submit
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

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
