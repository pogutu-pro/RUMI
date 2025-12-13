import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVisitorLogs,
  createVisitorLog,
  updateVisitorLogCheckOut,
  getNightCheckReports,
  createNightCheckReport,
  getLateEntryLogs,
  createLateEntryLog,
} from '@/features/caretaker';
import type { SecurityFilters, VisitorLog, NightCheckReport, LateEntryLog } from '@/types/caretaker.types';
import { useToast } from '@/hooks/use-toast';

// ==================== Visitor Logs ====================

export function useVisitorLogs(filters?: SecurityFilters) {
  return useQuery({
    queryKey: ['caretaker', 'security', 'visitors', filters],
    queryFn: () => getVisitorLogs(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateVisitorLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<VisitorLog, 'id' | 'loggedBy' | 'loggedByName'>) => createVisitorLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'security', 'visitors'] });
      toast({
        title: 'Visitor Logged',
        description: 'New visitor entry has been recorded.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to log visitor entry.',
        variant: 'destructive',
      });
    },
  });
}

export function useCheckOutVisitor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, timeOut }: { id: string; timeOut: string }) => updateVisitorLogCheckOut(id, timeOut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'security', 'visitors'] });
      toast({
        title: 'Visitor Checked Out',
        description: 'Visitor departure has been recorded.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to check out visitor.',
        variant: 'destructive',
      });
    },
  });
}

// ==================== Night Checks ====================

export function useNightCheckReports(filters?: SecurityFilters) {
  return useQuery({
    queryKey: ['caretaker', 'security', 'night-checks', filters],
    queryFn: () => getNightCheckReports(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateNightCheckReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<NightCheckReport, 'id' | 'performedBy' | 'performedByName' | 'createdAt'>) => 
      createNightCheckReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'security', 'night-checks'] });
      toast({
        title: 'Report Submitted',
        description: 'Night check report has been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit night check report.',
        variant: 'destructive',
      });
    },
  });
}

// ==================== Late Entries ====================

export function useLateEntryLogs(filters?: SecurityFilters) {
  return useQuery({
    queryKey: ['caretaker', 'security', 'late-entries', filters],
    queryFn: () => getLateEntryLogs(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateLateEntryLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<LateEntryLog, 'id' | 'loggedBy' | 'loggedByName' | 'createdAt'>) => 
      createLateEntryLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'security', 'late-entries'] });
      toast({
        title: 'Late Entry Recorded',
        description: 'Student late entry has been logged.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to log late entry.',
        variant: 'destructive',
      });
    },
  });
}
