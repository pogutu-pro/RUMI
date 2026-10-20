'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '../api/admin-users';
import type { AdminUserListParams } from '../types';

function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { message?: string };
  return anyErr?.message || fallback;
}

export function useAdminUserList(params: AdminUserListParams) {
  return useQuery({
    queryKey: ['admin-users', 'list', params],
    queryFn: () => adminUsersApi.listUsers(params),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      adminUsersApi.deactivateUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users', 'list'] });
      toast.success('User deactivated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not deactivate user')),
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => adminUsersApi.reactivateUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users', 'list'] });
      toast.success('User reactivated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not reactivate user')),
  });
}
