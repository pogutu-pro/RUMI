import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCaretakerDashboard,
  getTenants,
  getTenant,
  updateTenant,
  getRooms,
  getRoom,
  getMaintenanceRequests,
  getMaintenanceRequest,
  updateMaintenanceStatus,
  notifyLandlordAboutMaintenance,
  uploadMaintenancePhotos,
  getRoommateGroups,
  getRoommateMatchRequests,
  approveRoommateMatch,
  rejectRoommateMatch,
} from '@/lib/api/caretaker';
import type {
  TenantFilters,
  MaintenanceFilters,
  MaintenanceUpdate,
  RoommateAssignment,
} from '@/types/caretaker.types';
import { useToast } from './use-toast';

// ==================== Dashboard ====================

export function useCaretakerDashboard() {
  return useQuery({
    queryKey: ['caretaker', 'dashboard'],
    queryFn: getCaretakerDashboard,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
}

// ==================== Tenant Management ====================

export function useTenants(filters?: TenantFilters) {
  return useQuery({
    queryKey: ['caretaker', 'tenants', filters],
    queryFn: () => getTenants(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: ['caretaker', 'tenants', id],
    queryFn: () => getTenant(id!),
    enabled: !!id,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) => updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'tenants'] });
      toast({
        title: 'Success',
        description: 'Tenant information updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update tenant information',
        variant: 'destructive',
      });
    },
  });
}

// ==================== Roommate Management ====================

export function useRoommateGroups() {
  return useQuery({
    queryKey: ['caretaker', 'roommates', 'groups'],
    queryFn: getRoommateGroups,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRoommateMatchRequests() {
  return useQuery({
    queryKey: ['caretaker', 'roommates', 'match-requests'],
    queryFn: getRoommateMatchRequests,
    staleTime: 1000 * 60 * 2,
  });
}

export function useApproveRoommateMatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, assignment }: { requestId: string; assignment: RoommateAssignment }) =>
      approveRoommateMatch(requestId, assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'roommates'] });
      toast({
        title: 'Success',
        description: 'Roommate match approved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve roommate match',
        variant: 'destructive',
      });
    },
  });
}

export function useRejectRoommateMatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      rejectRoommateMatch(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'roommates'] });
      toast({
        title: 'Success',
        description: 'Roommate match request rejected',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject match request',
        variant: 'destructive',
      });
    },
  });
}

// ==================== Room Management ====================

export function useRooms() {
  return useQuery({
    queryKey: ['caretaker', 'rooms'],
    queryFn: getRooms,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRoom(id: string | undefined) {
  return useQuery({
    queryKey: ['caretaker', 'rooms', id],
    queryFn: () => getRoom(id!),
    enabled: !!id,
  });
}

// ==================== Maintenance ====================

export function useMaintenanceRequests(filters?: MaintenanceFilters) {
  return useQuery({
    queryKey: ['caretaker', 'maintenance', filters],
    queryFn: () => getMaintenanceRequests(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useMaintenanceRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['caretaker', 'maintenance', id],
    queryFn: () => getMaintenanceRequest(id!),
    enabled: !!id,
  });
}

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: Omit<MaintenanceUpdate, 'id' | 'requestId' | 'timestamp'> }) =>
      updateMaintenanceStatus(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'dashboard'] });
      toast({
        title: 'Success',
        description: 'Maintenance status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update maintenance status',
        variant: 'destructive',
      });
    },
  });
}

export function useUploadMaintenancePhotos() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: uploadMaintenancePhotos,
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to upload photos',
        variant: 'destructive',
      });
    },
  });
}

export function useNotifyLandlord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => notifyLandlordAboutMaintenance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'maintenance'] });
      toast({
        title: 'Success',
        description: 'Landlord has been notified',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to notify landlord',
        variant: 'destructive',
      });
    },
  });
}
