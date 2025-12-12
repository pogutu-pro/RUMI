import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getHostels, getHostelById, getHostelBySlug, type HostelsResponse } from '@/features/hostels';

export interface UseHostelsParams {
  search?: string;
  university?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  hostel_type?: string;
  gender_policy?: string;
  page?: number;
}

export function useHostels(params?: UseHostelsParams) {
  return useQuery<HostelsResponse>({
    queryKey: ['hostels', params],
    queryFn: () => getHostels(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useHostel(id: number | undefined) {
  return useQuery({
    queryKey: ['hostel', id],
    queryFn: () => id ? getHostelById(id) : Promise.reject('No ID provided'),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useHostelBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['hostel', slug],
    queryFn: () => slug ? getHostelBySlug(slug) : Promise.reject('No Slug provided'),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePrefetchHostel() {
  const queryClient = useQueryClient();
  
  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ['hostel', id],
      queryFn: () => getHostelById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}
