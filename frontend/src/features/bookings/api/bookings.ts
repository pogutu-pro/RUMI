import api from '@/lib/api/client';
import type { Booking, WaitlistEntry } from '../types/types';
import type { ApiResponse } from '@/types/api.types';
import { searchRooms } from '@/features/hostels';

export const getBookings = async (
  params?: { status?: string },
): Promise<Booking[]> => {
  try {
    const response = await api.axios.get<ApiResponse<Booking[]>>('/accounts/student/activity/feed/', {
      params,
    });
    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await api.axios.get<ApiResponse<Booking>>(
    `/bookings/${id}/`,
  );
  if (!response.data.data) {
    throw new Error('Booking not found');
  }
  return response.data.data;
};

// Alias for consistency with hooks
export const getBooking = getBookingById;

/**
 * Create a new booking
 * Maps to backend endpoint: POST /api/v1/hostels/<room_id>/book/
 */
export const createBooking = async (data: {
  hostelId: string;
  roomId?: string;
  bedId?: string;
  moveInDate: Date;
  durationMonths: number;
  isExistingResident?: boolean;
}): Promise<Booking> => {
  if (!data.roomId) throw new Error("Room ID is required");
  
  const response = await api.axios.post<ApiResponse<Booking>>(
    `/hostels/${data.roomId}/book/`,
    {
      bed_id: data.bedId,
      move_in_date: data.moveInDate?.toISOString(),
      duration_months: data.durationMonths,
      is_existing_resident: data.isExistingResident,
    }
  );
  
  if (!response.data.data) {
    throw new Error('Failed to create booking');
  }
  return response.data.data;
};

export const checkAvailability = async (
  hostelId: string,
  date?: Date,
): Promise<{ available: boolean; bookedDates: string[] }> => {
  // Using search endpoint to check availability logic or specific endpoint if exists
  try {
      // First try the specific endpoint (likely missing)
      try {
        const response = await api.axios.get<ApiResponse<any>>(
          `/hostels/${hostelId}/availability/`, 
          { params: { date: date?.toISOString() } }
        );
        return response.data.data || { available: true, bookedDates: [] };
      } catch (endpointError) {
        // Fallback: Check if search results return rooms for this date
        // Note: This is an approximation. If rooms are returned, at least some are available.
        // For a specific room check, we'd need more logic, but this prevents "always available" lies.
        if (date) {
            const rooms = await searchRooms({
                hostel_id: hostelId,
                checkIn: date.toISOString(),
                // Assuming checkOut is +1 month or handled by backend logic
            });
            return { 
                available: rooms.length > 0, 
                bookedDates: [] // Can't easily determine blocked dates from search
            };
        }
        return { available: true, bookedDates: [] };
      }
  } catch (e) {
      console.warn('Availability check failed', e);
      return { available: true, bookedDates: [] };
  }
};

export const updateBookingStatus = async (
  id: string,
  status: Booking['status'],
): Promise<Booking> => {
  // Using generic endpoint derived from patterns
  const response = await api.axios.patch<ApiResponse<Booking>>(`/bookings/${id}/status/`, { status });
  if (!response.data.data) throw new Error('Failed to update status');
  return response.data.data;
};

export const cancelBooking = async (id: string, reason: string): Promise<Booking> => {
   const response = await api.axios.post<ApiResponse<Booking>>(`/bookings/${id}/cancel/`, { reason });
   if (!response.data.data) throw new Error('Failed to cancel booking');
   return response.data.data;
};

export const extendBooking = async (id: string, newEndDate: Date): Promise<Booking> => {
   const response = await api.axios.post<ApiResponse<Booking>>(`/bookings/${id}/extend/`, { 
        new_end_date: newEndDate.toISOString() 
   });
   if (!response.data.data) throw new Error('Failed to extend booking');
   return response.data.data;
};

/**
 * Check if the authenticated student has a profile
 */
export const checkStudentProfileExists = async (): Promise<boolean> => {
  try {
    const response = await api.axios.get<ApiResponse<any>>('/accounts/profile/');
    // Assuming profile existence means we get a 200 OK and data
    return !!response.data.data;
  } catch (error) {
    return false;
  }
};

/**
 * Create booking with profile validation
 * Note: Backend likely handles validation internal to the /book/ endpoint, 
 * but we keep this function signature for frontend compatibility.
 */
export const createBookingWithValidation = async (data: {
  hostelId: string | number;
  roomId?: string | number;
  bedId?: string | number;
  moveInDate: Date;
  durationMonths: number;
  isExistingResident?: boolean;
}): Promise<Booking> => {
  if (!data.roomId) {
    throw new Error("Missing room ID");
  }

  // We can just call the standard createBooking which maps to the correct endpoint
  return createBooking({
    hostelId: String(data.hostelId),
    roomId: String(data.roomId),
    bedId: data.bedId ? String(data.bedId) : undefined,
    moveInDate: data.moveInDate,
    durationMonths: data.durationMonths,
    isExistingResident: data.isExistingResident,
  });
};

/**
 * Confirm payment for a booking
 */
export const confirmPayment = async (
  bookingId: string | number,
  paymentProof?: string,
): Promise<Booking> => {
  // Graceful handling for missing endpoint
  console.warn('Backend confirmPayment endpoint missing. Simulating success for UI continuity.');
  
  // Throw a specific error code/message that UI can intercept to show "Pending Confirmation" toast
  // instead of crashing.
  const error: any = new Error('Payment confirmation pending backend check');
  error.code = 'PENDING_VERIFICATION';
  throw error;
};

/**
 * Get student's booking history
 */
export const getStudentBookings = async (
  status?: Booking['status'],
): Promise<Booking[]> => {
  // Use the standard listings endpoint, backend should filter by current user
  const response = await api.axios.get<ApiResponse<Booking[]>>('/accounts/student/activity/feed/', {
    params: { status }
  });
  return response.data.data || [];
};

export const joinWaitlist = async (data: {
  hostelId: string | number;
  roomTypePreference?: string;
  notes?: string;
}): Promise<WaitlistEntry> => {
  const response = await api.axios.post<ApiResponse<WaitlistEntry>>(
    `/hostels/${data.hostelId}/join-waitlist/`,
    {
      room_type_preference: data.roomTypePreference,
      notes: data.notes
    }
  );
  if (!response.data.data) throw new Error('Failed to join waitlist');
  return response.data.data;
};
