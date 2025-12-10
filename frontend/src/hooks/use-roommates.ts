import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roommatesApi, type RoommateSummary } from '@/lib/api/roommates';
import { toast } from 'sonner';

/**
 * Hook to fetch current student's roommates
 * @returns Query result with roommates data
 */
export const useRoommates = () => {
  return useQuery<RoommateSummary[], Error>({
    queryKey: ['roommates', 'me'],
    queryFn: roommatesApi.getRoommates,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Hook to fetch roommate profile
 * @param roommateId - The ID of the roommate
 * @returns Query result with roommate profile
 */
export const useRoommateProfile = (roommateId: string | null | undefined) => {
  return useQuery({
    queryKey: ['roommate', 'profile', roommateId],
    queryFn: async () => {
      if (!roommateId) throw new Error('Roommate ID is required');
      return roommatesApi.getRoommateProfile(roommateId);
    },
    enabled: !!roommateId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch roommate matches (potential roommates)
 * @returns Query result with matched roommates
 */
export const useRoommateMatches = () => {
  return useQuery({
    queryKey: ['roommate', 'matches'],
    queryFn: roommatesApi.getRoommateMatches,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Hook to fetch roommate requests (sent and received)
 * @returns Query result with roommate requests
 */
export const useRoommateRequests = () => {
  return useQuery({
    queryKey: ['roommate', 'requests'],
    queryFn: roommatesApi.getRoommateRequests,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to send a roommate request
 * @returns Mutation for sending roommate request
 */
export const useSendRoommateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message?: string }) =>
      roommatesApi.sendRoommateRequest(userId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommate', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['roommate', 'matches'] });
      toast.success('Roommate request sent');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to send roommate request';
      toast.error(message);
    },
  });
};

/**
 * Hook to respond to a roommate request
 * @returns Mutation for accepting/rejecting roommate request
 */
export const useRespondToRoommateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      roommatesApi.respondToRequest(requestId, accept),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roommate', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['roommates', 'me'] });
      toast.success(variables.accept ? 'Request accepted' : 'Request declined');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to respond to request';
      toast.error(message);
    },
  });
};

/**
 * Hook to update roommate preferences
 * @returns Mutation for updating preferences
 */
export const useUpdateRoommatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: any) => 
      roommatesApi.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommate', 'matches'] });
      toast.success('Preferences updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update preferences';
      toast.error(message);
    },
  });
};

/**
 * Hook to remove a roommate
 * @returns Mutation for removing roommate
 */
export const useRemoveRoommate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roommateId: string) => roommatesApi.removeRoommate(roommateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roommates', 'me'] });
      toast.success('Roommate removed successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to remove roommate';
      toast.error(message);
    },
  });
};
