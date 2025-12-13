
import { useQuery } from '@tanstack/react-query';
import { getBookings } from '@/features/bookings/api/bookings';
import { Booking } from '@/types/entities.types';
import { queryKeys } from '@/lib/react-query/query-keys';

export const useMyBooking = () => {
  return useQuery<Booking | null, Error>({
    queryKey: queryKeys.bookings.list({ status: 'active' }), // Assuming backend filters by user automatically
    queryFn: async () => {
      // Fetch all bookings for the user. 
      // Ideally backend filters this. If backend returns ALL system bookings, this is a security risk, 
      // but assuming it's scoped to user.
      const bookings = await getBookings({ status: 'active' });
      // Return the first active booking or null
      return bookings.length > 0 ? bookings[0] : null;
    },
    staleTime: 5 * 60 * 1000,
  });
};
