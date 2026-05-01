import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/react-query/query-keys';
import { getHostels, getHostel, getHostelById, createHostel, searchHostels } from '@/features/hostels';
import apiClient from '@/lib/api/client';
import type { Hostel } from '@/types/entities.types';
import { HostelsResponse } from '@/features/hostels/api/hostels';

export interface UseHostelsParams {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sort?: string;
  status?: string;
  university?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  hostel_type?: string;
  gender_policy?: string;
  page?: number;
}

export interface UseHostelOptions {
  enabled?: boolean;
  includeRooms?: boolean;
  includeReviews?: boolean;
  refetchOnWindowFocus?: boolean;
}

export const useHostels = (params?: UseHostelsParams) => {
  return useQuery<HostelsResponse, Error>({
    queryKey: queryKeys.hostels.list(
      params as Record<string, unknown> | undefined
    ),
    queryFn: () => getHostels(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useLandlordHostels = () => {
  return useQuery<HostelsResponse, Error>({
    queryKey: queryKeys.hostels.landlordHostels(),
    queryFn: async () => {
      const res = await apiClient.get<any>('/landlord/hostels/');
      const data = res.data;
      
      // Normalize response structure
      if (data?.results) {
        return data as HostelsResponse;
      }
      if (data?.data?.results) {
        return data.data as HostelsResponse;
      }
      if (Array.isArray(data)) {
        return { count: data.length, next: null, previous: null, results: data } as HostelsResponse;
      }
      if (Array.isArray(data?.data)) {
        return { count: data.data.length, next: null, previous: null, results: data.data } as HostelsResponse;
      }
      
      return { count: 0, next: null, previous: null, results: [] } as HostelsResponse;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useSearchHostels = (params?: UseHostelsParams) => {
  return useQuery<HostelsResponse, Error>({
    queryKey: queryKeys.hostels.list(
      params as Record<string, unknown> | undefined
    ),
    queryFn: () => searchHostels(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useHostel = (
  idOrSlug: string | null | undefined,
  options?: UseHostelOptions
) => {
  return useQuery<Hostel, Error>({
    queryKey: queryKeys.hostels.hostel(idOrSlug || '', {
      includeRooms: options?.includeRooms,
      includeReviews: options?.includeReviews,
    }),
    queryFn: async () => {
      if (!idOrSlug) {
        throw new Error('Hostel identifier is required');
      }
      const res = await getHostel(idOrSlug);
      if (!res) throw new Error('Hostel not found');
      return res;
    },
    enabled: Boolean(idOrSlug) && options?.enabled !== false,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    retry: 1,
  });
};

export const usePrefetchHostel = () => {
  const queryClient = useQueryClient();
  
  return (id: string) => { // Changed id to string to match queryKeys expectations usually
    queryClient.prefetchQuery({
      queryKey: queryKeys.hostels.hostel(id),
      queryFn: () => getHostel(id),
      staleTime: 10 * 60 * 1000,
    });
  };
};

export const useHostelBySlug = useHostel;

/**
 * Hook to create a new hostel
 * Used in the landlord hostel creation wizard
 */
export const useCreateHostel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Hostel>) => createHostel(data),
    onSuccess: () => {
      // Invalidate both general and landlord hostels lists
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.landlordHostels() });
      toast.success('Hostel created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create hostel';
      toast.error(message);
    },
  });
};

