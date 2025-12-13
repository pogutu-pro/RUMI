import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicketStatus,
  addTicketReply,
  assignTicket,
} from '@/features/support';
import { queryKeys } from '@/lib/react-query/query-keys';
import { toast } from 'sonner';
import type { SupportTicket, SupportCategory, SupportPriority } from '@/types/entities.types';

export interface UseTicketsFilters {
  status?: SupportTicket['status'];
  category?: SupportCategory;
  priority?: SupportPriority;
  assignedTo?: string;
}

export interface CreateTicketRequest {
  category: SupportCategory;
  subject: string;
  description: string;
  priority?: SupportPriority;
}

/**
 * Hook to fetch all support tickets with optional filters
 * @param filters - Optional filters for tickets
 * @returns Query result with tickets data
 */
export const useSupportTickets = (filters?: UseTicketsFilters) => {
  return useQuery({
    queryKey: [...queryKeys.support.all, filters],
    queryFn: () => getTickets(filters),
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to fetch a single support ticket
 * @param ticketId - The ID of the ticket
 * @returns Query result with ticket data
 */
export const useSupportTicket = (ticketId: string | null | undefined) => {
  return useQuery({
    queryKey: [...queryKeys.support.all, ticketId],
    queryFn: async () => {
      if (!ticketId) throw new Error('Ticket ID is required');
      return getTicket(ticketId);
    },
    enabled: !!ticketId,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to create a new support ticket
 * @returns Mutation for creating a ticket
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketRequest) => createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.support.all });
      toast.success('Support ticket created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create support ticket';
      toast.error(message);
    },
  });
};

/**
 * Hook to update ticket status
 * @returns Mutation for updating ticket status
 */
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportTicket['status'] }) =>
      updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.support.all });
      toast.success('Ticket status updated');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update ticket status';
      toast.error(message);
    },
  });
};

/**
 * Hook to add a reply to a ticket
 * @returns Mutation for adding a reply
 */
export const useAddTicketReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, message, isInternal }: { 
      ticketId: string; 
      message: string; 
      isInternal?: boolean;
    }) => addTicketReply(ticketId, message, isInternal),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.support.all, variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.support.all });
      toast.success('Reply added successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add reply';
      toast.error(message);
    },
  });
};

/**
 * Hook to assign a ticket to a support agent
 * @returns Mutation for assigning ticket
 */
export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) =>
      assignTicket(ticketId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.support.all });
      toast.success('Ticket assigned successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to assign ticket';
      toast.error(message);
    },
  });
};
