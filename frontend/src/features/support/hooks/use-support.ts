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

export const useSupportUsers = (params?: { role?: string; is_active?: boolean; is_verified?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['tech-support', 'users', params],
    queryFn: () => techSupportApi.getUsers(params),
    staleTime: 1000 * 60 * 5,
  });
};

// Verification Queue - Unverified users
export const useVerificationQueue = (params?: { role?: string; page?: number }) => {
  return useQuery({
    queryKey: ['tech-support', 'verification-queue', params],
    queryFn: () => techSupportApi.getVerificationQueue(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// User Profile Details
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['tech-support', 'user-profile', userId],
    queryFn: () => techSupportApi.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

// Verify User Mutation
export const useVerifyUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: techSupportApi.verifyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-support', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['tech-support', 'verification-queue'] });
      toast.success('User verified successfully');
    },
    onError: () => {
      toast.error('Failed to verify user');
    },
  });
};

// Toggle User Lock/Suspend Mutation
export const useToggleUserLock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      techSupportApi.toggleUserLock(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-support', 'users'] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });
};

// Reset User Password Mutation
export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: techSupportApi.resetUserPassword,
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
    onError: () => {
      toast.error('Failed to send password reset email');
    },
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

export const useSupportStats = () => {
  return useQuery({
    queryKey: ['tech-support', 'stats'],
    queryFn: () => techSupportApi.getStats(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useTechSupportSystemHealth = () => {
  return useQuery({
    queryKey: ['tech-support', 'system-health'],
    queryFn: () => techSupportApi.getSystemHealth(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refresh every minute
  });
};

export const useSupportAnalytics = () => {
  return useQuery({
    queryKey: ['tech-support', 'analytics'],
    queryFn: () => techSupportApi.getAnalyticsPerformance(),
    staleTime: 1000 * 60 * 15, // 15 mins
  });
};

export const useTechSupportTeam = () => {
  return useQuery({
    queryKey: ['tech-support', 'team'],
    queryFn: () => techSupportApi.getTechSupportTeam(),
    staleTime: 1000 * 60 * 60, // 1 hour
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

