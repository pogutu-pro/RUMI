'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supportApi } from '../api/client';
import type { TicketStatus } from '../types/types';

const keys = {
  tickets: (status?: TicketStatus) => ['support', 'tickets', status ?? 'all'] as const,
  ticket: (id: string) => ['support', 'tickets', id] as const,
};

function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { detail?: string } } };
  return anyErr?.response?.data?.detail || fallback;
}

export const useTickets = (status?: TicketStatus) =>
  useQuery({ queryKey: keys.tickets(status), queryFn: () => supportApi.listTickets(status) });

export const useTicket = (id: string) =>
  useQuery({ queryKey: keys.ticket(id), queryFn: () => supportApi.getTicket(id), enabled: !!id });

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
