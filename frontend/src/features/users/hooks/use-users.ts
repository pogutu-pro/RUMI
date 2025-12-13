import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getUser,
} from '@/features/users';
import { useAuthStore, useIsAuthenticated } from '@/features/auth';
import type { User } from '@/types/entities.types';

export interface UseUserOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
}

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

export const useUser = (
  id?: string | null,
  options?: UseUserOptions
) => {
   const { user: currentUser } = useAuthStore();
    
    // If no userId is provided, use the current user's ID
    const targetUserId = id || currentUser?.id;

  return useQuery({
    queryKey: targetUserId ? queryKeys.users.detail(targetUserId) : ['user', 'unknown'],
    queryFn: () => {
        if (!targetUserId) throw new Error('User ID is required');
        return getUserById(targetUserId);
    },
    enabled: !!targetUserId && (options?.enabled !== false),
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: User['status'] }) =>
      updateUserStatus(id, { status }),
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

/**
 * Hook to get the current authenticated user
 * @returns The current user from auth store
 */
export const useCurrentUser = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useIsAuthenticated();
  
  return {
    user,
    isAuthenticated,
    isLoading: false,
  };
};
