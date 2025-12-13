import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { techSupportApi } from '@/features/support/api/tech-support';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { 
  TechSupportUser, 
  TechSupportHostel, 
  TechSupportTicket,
  TechSupportTransaction,
  TechSupportMessage,
  TechSupportLog
} from '@/features/support/api/tech-support'; // Import types from API file where they are defined

// --- HOOKS ---

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
