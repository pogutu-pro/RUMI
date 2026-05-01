import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getBookings,
  getBookingById,
  updateBookingStatus,
} from '@/features/bookings';
import type { Booking } from '@/types/entities.types';

export interface UseBookingOptions {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}

interface UseBookingsParams {
  status?: Booking['status'] | 'all';
  hostel_id?: string;
}

export const useBookings = (params?: UseBookingsParams) => {
  const backendParams: Record<string, any> = {};
  
  if (params?.status && params.status !== 'all') {
      backendParams.status = params.status;
  }
  
  if (params?.hostel_id) {
      backendParams.hostel_id = params.hostel_id;
  }

  const finalParams = Object.keys(backendParams).length > 0 ? backendParams : undefined;

  return useQuery<Booking[], Error>({
    queryKey: queryKeys.bookings.list(finalParams as Record<string, unknown> | undefined),
    queryFn: () => getBookings(finalParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useBooking = (
  id: string | null | undefined,
  options?: UseBookingOptions
) => {
  return useQuery<Booking, Error>({
    queryKey: id ? queryKeys.bookings.detail(id) : queryKeys.bookings.detail(''),
    queryFn: () => {
      if (!id) throw new Error('Booking identifier is required');
      return getBookingById(id);
    },
    enabled: Boolean(id) && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Booking['status'];
    }) => updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.bookings() });
    },
  });
};
