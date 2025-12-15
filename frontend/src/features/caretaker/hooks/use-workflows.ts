import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVisitorInvitations,
  approveVisitorInvitation,
  rejectVisitorInvitation,
  checkInVisitor,
  checkOutVisitor,
  getRoommateRequests,
  approveRoommateRequest,
  rejectRoommateRequest,
  getApprovalRequests,
  approveRequest,
  rejectRequest,
} from '../api/workflows';
import type { VisitorInvitation, RoommateRequest, ApprovalRequest } from '../api/workflows';
import { toast } from 'sonner';

// ==================== Visitor Invitations ====================

export function useVisitorInvitations() {
  return useQuery<VisitorInvitation[]>({
    queryKey: ['caretaker', 'visitor-invitations'],
    queryFn: () => getVisitorInvitations(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useApproveVisitorInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveVisitorInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'visitor-invitations'] });
      toast.success('Visitor invitation approved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve invitation');
    },
  });
}

export function useRejectVisitorInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectVisitorInvitation(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'visitor-invitations'] });
      toast.success('Visitor invitation rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject invitation');
    },
  });
}

export function useCheckInVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => checkInVisitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'visitor-invitations'] });
      toast.success('Visitor checked in successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check in visitor');
    },
  });
}

export function useCheckOutVisitorInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => checkOutVisitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'visitor-invitations'] });
      toast.success('Visitor checked out successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check out visitor');
    },
  });
}

// ==================== Roommate Requests ====================

export function useRoommateRequests() {
  return useQuery<RoommateRequest[]>({
    queryKey: ['caretaker', 'roommate-requests'],
    queryFn: () => getRoommateRequests(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useApproveRoommateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveRoommateRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'roommate-requests'] });
      toast.success('Roommate request approved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });
}

export function useRejectRoommateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRoommateRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'roommate-requests'] });
      toast.success('Roommate request rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });
}

// ==================== Approval Requests ====================

export function useApprovalRequests() {
  return useQuery<ApprovalRequest[]>({
    queryKey: ['caretaker', 'approvals'],
    queryFn: () => getApprovalRequests(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => approveRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'approvals'] });
      toast.success('Request approved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'approvals'] });
      toast.success('Request rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });
}
