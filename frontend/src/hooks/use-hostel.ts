import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import { getHostels, getHostel } from '@/lib/api/hostels';
import type { Hostel } from '@/types/entities.types';

export interface UseHostelsParams {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sort?: string;
}

export interface UseHostelOptions {
  enabled?: boolean;
  includeRooms?: boolean;
  includeReviews?: boolean;
  refetchOnWindowFocus?: boolean;
}

export const useHostels = (params?: UseHostelsParams) => {
  return useQuery<Hostel[], Error>({
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
      return res.data;
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

