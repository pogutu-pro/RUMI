'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supportApi } from '../api/client';
import type { TicketStatus } from '../types/types';

const keys = {
  tickets: (status?: TicketStatus) => ['support', 'tickets', status ?? 'all'] as const,
  ticket: (id: string) => ['support', 'tickets', id] as const,
};

// WR-01 (03-REVIEW.md): the rejected value from axiosInstance is the
// normalized ApiError shape ({ message, statusCode, details }), not a raw
// AxiosError — it has no `.response` property. Read the message the
// interceptor already computed instead.
function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { message?: string };
  return anyErr?.message || fallback;
}

// Tickets are a two-sided conversation: the other party's reply arrives while
// this screen is open. The app-wide 5-minute staleTime and no focus refetch
// would freeze a thread for minutes, so ticket data is always considered
// stale and polled while visible.
const TICKET_LIST_POLL_MS = 30_000;
const TICKET_THREAD_POLL_MS = 8_000;

export const useTickets = (status?: TicketStatus) =>
  useQuery({
    queryKey: keys.tickets(status),
    queryFn: () => supportApi.listTickets(status),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: TICKET_LIST_POLL_MS,
  });

export const useTicket = (id: string) =>
  useQuery({
    queryKey: keys.ticket(id),
    queryFn: () => supportApi.getTicket(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: TICKET_THREAD_POLL_MS,
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: supportApi.createTicket,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
      toast.success('Ticket submitted — we\'ll get back to you soon');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not submit ticket')),
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: TicketStatus; assigned_to?: string | null } }) =>
      supportApi.updateTicket(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
      qc.invalidateQueries({ queryKey: keys.ticket(id) });
      toast.success('Ticket updated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update ticket')),
  });
};

export const useAddTicketMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      supportApi.addMessage(ticketId, message),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: keys.ticket(ticketId) });
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not send reply')),
  });
};
