import { useQuery } from '@tanstack/react-query';
import { getBooking } from '@/lib/api/bookings';
import type { Booking } from '@/types/entities.types';

export interface UseBookingOptions {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Hook to fetch a single booking by ID
 * @param bookingId - The ID of the booking to fetch
 * @param options - Query options
 * @returns Query result with booking data, loading state, and error
 */
export const useBooking = (
  bookingId: string | null | undefined,
  options?: UseBookingOptions
) => {
  return useQuery<Booking, Error>({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }
      const response = await getBooking(bookingId);
      return response.data;
    },
    enabled: !!bookingId && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
  });
};
