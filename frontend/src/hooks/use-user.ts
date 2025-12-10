import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/lib/api/users';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types/entities.types';

export interface UseUserOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
}

/**
 * Hook to fetch a user by ID or get the current user
 * @param userId - The ID of the user to fetch (optional, defaults to current user)
 * @param options - Query options
 * @returns Query result with user data, loading state, and error
 */
export const useUser = (
  userId?: string | null,
  options?: UseUserOptions
) => {
  const { user: currentUser } = useAuthStore();
  
  // If no userId is provided, use the current user's ID
  const targetUserId = userId || currentUser?.id;

  return useQuery<User, Error>({
    queryKey: ['user', targetUserId],
    queryFn: async () => {
      if (!targetUserId) {
        throw new Error('User ID is required');
      }
      return await getUser(targetUserId);
    },
    enabled: !!targetUserId && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  });
};

/**
 * Hook to get the current authenticated user
 * @returns The current user from auth store
 */
export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    isLoading: false,
  };
};
