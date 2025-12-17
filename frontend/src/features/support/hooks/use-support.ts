import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { techSupportApi } from '@/features/support/api/tech-support';
import * as supportApi from '@/features/support/api/support'; // Import student-facing API
import { queryKeys } from '@/lib/react-query/query-keys';
import { toast } from 'sonner';

// --- STUDENT HOOKS ---

export const useMySupportTickets = (filters?: any) => {
  return useQuery({
    queryKey: ['support', 'my-tickets', filters],
    queryFn: () => supportApi.getTickets(filters),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: supportApi.createTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support', 'my-tickets'] });
            toast.success('Ticket created successfully');
        },
        onError: () => {
            toast.error('Failed to create ticket');
        }
    });
};

// --- TECH SUPPORT HOOKS ---

export const useSupportUsers = (params?: any) => {
  return useQuery({
    queryKey: ['tech-support', 'users', params],
    queryFn: () => techSupportApi.getUsers(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSupportHostels = (params?: any) => {
  return useQuery({
    queryKey: ['tech-support', 'hostels', params],
    queryFn: () => techSupportApi.getHostels(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSupportTransactions = (params?: any) => {
  return useQuery({
    queryKey: ['tech-support', 'transactions', params],
    queryFn: () => techSupportApi.getTransactions(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSupportTickets = (params?: any) => {
  return useQuery({
    queryKey: ['tech-support', 'tickets', params],
    queryFn: () => techSupportApi.getTickets(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSupportMessages = (params?: any) => {
  return useQuery({
    queryKey: ['tech-support', 'messages', params],
    queryFn: () => techSupportApi.getMessages(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSupportLogs = (params?: any) => {
  return useQuery({
    queryKey: ['tech-support', 'logs', params],
    queryFn: () => techSupportApi.getLogs(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const useTicketReplies = (ticketId: string) => {
  return useQuery({
    queryKey: ['support', 'tickets', ticketId, 'replies'],
    queryFn: () => supportApi.getTicketReplies(ticketId),
    enabled: !!ticketId,
  });
};

export const useAddTicketReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
        return supportApi.addTicketReply(ticketId, message, false);
    },
    onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ['support', 'tickets', variables.ticketId, 'replies'] });
       toast.success('Reply sent successfully');
    },
    onError: () => {
       toast.error('Failed to send reply');
    }
  });
};

export const useSupportTicket = (ticketId: string) => {
   return useQuery({
     queryKey: ['support', 'tickets', ticketId],
     queryFn: () => supportApi.getTicket(ticketId),
     enabled: !!ticketId
   });
};

export const useUpdateTicketStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ticketId, status }: { ticketId: string; status: any }) => {
            await supportApi.updateTicketStatus(ticketId, status);
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['tech-support', 'tickets'] });
             queryClient.invalidateQueries({ queryKey: ['support', 'my-tickets'] });
             toast.success('Ticket status updated');
        }
    });
};

export const useTechSupportStore = () => {
    return {
        // Mocking store for now to pass build
        selectedTicket: null,
        setSelectedTicket: () => {},
    };
};

