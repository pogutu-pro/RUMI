import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getBookings,
  getBookingById,
  updateBookingStatus,
} from '@/features/bookings';
import type { Booking } from '@/types/entities.types';

interface UseBookingsParams {
  status?: Booking['status'] | 'all';
}

export const useBookings = (params?: UseBookingsParams) => {
  const backendParams =
    params && params.status && params.status !== 'all'
      ? { status: params.status }
      : undefined;

  return useQuery<Booking[], Error>({
    queryKey: queryKeys.bookings.list(backendParams as Record<string, unknown> | undefined),
    queryFn: () => getBookings(backendParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useBooking = (id: string | null | undefined) => {
  return useQuery<Booking, Error>({
    queryKey: id ? queryKeys.bookings.detail(id) : queryKeys.bookings.detail(''),
    queryFn: () => {
      if (!id) throw new Error('Booking identifier is required');
      return getBookingById(id);
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
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
