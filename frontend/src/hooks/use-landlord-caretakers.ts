import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  landlordCaretakersApi,
  type CreateCaretakerRequest,
  type UpdateCaretakerRequest,
  type LandlordCaretaker,
} from '@/lib/api/landlord-caretakers';

/**
 * Query key factory for caretaker-related queries
 */
export const caretakerKeys = {
  all: ['landlord', 'caretakers'] as const,
  lists: () => [...caretakerKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...caretakerKeys.lists(), filters] as const,
  details: () => [...caretakerKeys.all, 'detail'] as const,
  detail: (id: string) => [...caretakerKeys.details(), id] as const,
};

/**
 * Hook to fetch all caretakers for the logged-in landlord
 */
export const useCaretakers = () => {
  return useQuery({
    queryKey: caretakerKeys.lists(),
    queryFn: landlordCaretakersApi.getMyCaretakers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a specific caretaker by ID
 */
export const useCaretaker = (id: string) => {
  return useQuery({
    queryKey: caretakerKeys.detail(id),
    queryFn: () => landlordCaretakersApi.getCaretaker(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to create a new caretaker
 */
export const useCreateCaretaker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCaretakerRequest) =>
      landlordCaretakersApi.createCaretaker(data),
    onSuccess: (newCaretaker) => {
      // Invalidate and refetch caretakers list
      queryClient.invalidateQueries({ queryKey: caretakerKeys.lists() });
      
      // Optimistically add to cache
      queryClient.setQueryData<LandlordCaretaker[]>(
        caretakerKeys.lists(),
        (old) => (old ? [newCaretaker, ...old] : [newCaretaker])
      );
      
      toast.success('Caretaker account created successfully! Invitation email sent.');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to create caretaker account';
      toast.error(message);
    },
  });
};

/**
 * Hook to update caretaker details
 */
export const useUpdateCaretaker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCaretakerRequest }) =>
      landlordCaretakersApi.updateCaretaker(id, data),
    onSuccess: (updatedCaretaker, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: caretakerKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: caretakerKeys.detail(variables.id),
      });
      
      // Update cache
      queryClient.setQueryData(
        caretakerKeys.detail(variables.id),
        updatedCaretaker
      );
      
      toast.success('Caretaker details updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update caretaker';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete/deactivate a caretaker
 */
export const useDeleteCaretaker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landlordCaretakersApi.deleteCaretaker(id),
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: caretakerKeys.lists() });
      queryClient.removeQueries({ queryKey: caretakerKeys.detail(deletedId) });
      
      toast.success('Caretaker account deactivated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to deactivate caretaker';
      toast.error(message);
    },
  });
};
