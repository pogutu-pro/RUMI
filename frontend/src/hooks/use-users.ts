import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
} from '@/lib/api/users';
import type { User } from '@/types/entities.types';

interface UseUsersParams {
  role?: User['role'] | 'all';
  status?: User['status'];
  search?: string;
  page?: number;
  limit?: number;
}

export const useUsers = (params?: UseUsersParams) => {
  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown> | undefined),
    queryFn: () => getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: User['status'] }) =>
      updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};
