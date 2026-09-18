'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, UserCheck, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils/cn';
import { PageHeader } from '@/components/dashboard/page-header';
import { useAuth } from '@/features/auth';
import { useTickets, useTicket, useUpdateTicket, useAddTicketMessage } from '@/features/support/hooks/use-support';
import type { SupportTicket, TicketStatus, TicketPriority } from '@/features/support/types/types';

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

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Badge has no "warning" variant, so urgent/high get their own classes
// layered on top via className rather than inventing a 5th badge variant
// project-wide for one screen.
const PRIORITY_CLASS: Record<TicketPriority, string> = {
  urgent: '',
  high: 'border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100',
  medium: '',
  low: 'border-transparent bg-muted text-muted-foreground hover:bg-muted',
};

const STATUS_FILTERS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_FILTERS: { value: TicketPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge
      variant={priority === 'urgent' ? 'destructive' : 'outline'}
      className={PRIORITY_CLASS[priority]}
    >
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}

function AssignmentControl({ ticket }: { ticket: SupportTicket }) {
  const { user } = useAuth();
  const updateTicket = useUpdateTicket();
  const isMine = !!user && ticket.assigned_to === user.id;

  if (isMine) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
        <UserCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Assigned to you
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {ticket.assigned_to_name ? (
        <span className="text-xs text-muted-foreground">
          Assigned to {ticket.assigned_to_name}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Unassigned</span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 px-2.5 text-xs"
        disabled={updateTicket.isPending || !user}
        onClick={() =>
          user &&
          updateTicket.mutate({ id: ticket.id, payload: { assigned_to: user.id } })
        }
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        {ticket.assigned_to_name ? 'Take over' : 'Assign to me'}
      </Button>
    </div>
  );
}

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
              <div className="flex items-start justify-between gap-3">
                <DialogTitle>{ticket.subject}</DialogTitle>
                <PriorityBadge priority={ticket.priority} />
              </div>
            </DialogHeader>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {ticket.created_by_name} · {ticket.created_by_role}
              </span>
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
            {ticket.category === 'maintenance' && (
              <div className="text-xs text-muted-foreground">
                Maintenance
                {ticket.unit_label ? ` · ${ticket.unit_label}` : ''}
              </div>
            )}
            <p className="text-sm">{ticket.description}</p>

            <div className="flex flex-wrap items-center gap-3 border-t pt-3">
              <div className="flex items-center gap-2">
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
              <AssignmentControl ticket={ticket} />
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

/** Shared ticket queue — rendered by both tech-support's own dashboard and
 * the super-admin platform shell's Support page, so super_admin keeps its
 * own sidebar (Overview/Organizations/Users/.../Audit log) instead of
 * dropping into tech-support's unrelated Tickets/Blog shell. */
export function TicketQueue() {
  const [statusFilter, setStatusFilter] = React.useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<TicketPriority | 'all'>('all');
  const [search, setSearch] = React.useState('');
  const [activeTicketId, setActiveTicketId] = React.useState<string | null>(null);

  // Fetch every ticket once and filter client-side, rather than round-
  // tripping per filter change — this also gives accurate counts for the
  // stats row regardless of which filter is currently active.
  const { data: allTickets = [], isLoading } = useTickets();

  const counts = React.useMemo(() => {
    const base: Record<TicketStatus, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    for (const t of allTickets) base[t.status] += 1;
    return base;
  }, [allTickets]);

  const filteredTickets = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return allTickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (query && !t.subject.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [allTickets, statusFilter, priorityFilter, search]);

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || search.trim() !== '';

  return (
    <div className="space-y-4">
      <PageHeader title="Support tickets" />

      {/* Stats — also act as status filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATUS_FILTERS.filter((f) => f.value !== 'all').map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(statusFilter === f.value ? 'all' : (f.value as TicketStatus))}
            className={cn(
              'rounded-2xl border p-3 text-left transition-colors',
              statusFilter === f.value
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:bg-muted/50',
            )}
          >
            <p className="text-2xl font-bold text-foreground">{counts[f.value as TicketStatus]}</p>
            <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject"
            className="pl-9"
          />
        </div>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}>
          <SelectTrigger className="h-10 w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? 'search' : 'default'}
          title={hasActiveFilters ? 'No tickets match your filters' : 'No tickets here'}
          description={
            hasActiveFilters
              ? 'Try a different status, priority, or search term.'
              : "You're all caught up. New tickets will show up here."
          }
        />
      ) : (
        <ul className="divide-y rounded-2xl border bg-background">
          {filteredTickets.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setActiveTicketId(t.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.subject}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.created_by_name} · {t.created_by_role} · {t.unit_label ? `${t.unit_label} · ` : ''}
                    {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    {t.assigned_to_name ? ` · ${t.assigned_to_name}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <PriorityBadge priority={t.priority} />
                  <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                </span>
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
