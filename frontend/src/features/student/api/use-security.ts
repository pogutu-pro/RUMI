import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentSecurityApi } from './security';
import { toast } from 'sonner';

const securityKeys = {
  all: ['student', 'security'] as const,
  lateEntries: () => [...securityKeys.all, 'late-entries'] as const,
  visitorInvitations: () => [...securityKeys.all, 'visitor-invitations'] as const,
};

// Hooks
export const useMyLateEntries = () => {
  return useQuery({
    queryKey: securityKeys.lateEntries(),
    queryFn: () => studentSecurityApi.getMyLateEntries(),
  });
};

export const useMyVisitorInvitations = () => {
  return useQuery({
    queryKey: securityKeys.visitorInvitations(),
    queryFn: () => studentSecurityApi.getMyVisitorInvitations(),
  });
};

export const useCreateVisitorInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentSecurityApi.createVisitorInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.visitorInvitations() });
      toast.success('Visitor invitation sent successfully', {
        description: 'Caretaker will check them in when they arrive',
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to send invitation';
      toast.error(message);
    },
  });
};

export const useAcknowledgeLateEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentSecurityApi.acknowledgeLateEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.lateEntries() });
      toast.success('Late entry report acknowledged');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to acknowledge report';
      toast.error(message);
    },
  });
};
