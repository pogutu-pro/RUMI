import { useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import { getHostels, getHostel, getHostelById } from '@/features/hostels';
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

/**
 * Hook to fetch landlord's own hostels
 * Used for landlord dashboard operations like assigning caretakers
 */
export const useLandlordHostels = () => {
  return useQuery<Hostel[], Error>({
    queryKey: queryKeys.hostels.landlordHostels(),
    queryFn: async () => {
      const response = await getHostels({});
      return response.results;
    },
    staleTime: 5 * 60 * 1000,
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
