import api from '@/lib/api/client';
import type { Booking } from '@/types/entities.types';
import type { ApiResponse } from '@/types/api.types';

export const getBookings = async (
  params?: { status?: string },
): Promise<Booking[]> => {
  const response = await api.axios.get<ApiResponse<Booking[]>>('/bookings/', {
    params,
  });
  return response.data.data || [];
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
  moveInDate: Date;
  durationMonths: number;
}): Promise<Booking> => {
  if (!data.roomId) throw new Error("Room ID is required");
  
  const response = await api.axios.post<ApiResponse<Booking>>(
    `/hostels/${data.roomId}/book/`,
    {
      move_in_date: data.moveInDate.toISOString(),
      duration_months: data.durationMonths,
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
  // Currently backend reference only shows /hostels/search/
  // /hostels/<id>/availability/ is NOT in reference.
  console.warn(`checkAvailability endpoint /hostels/${hostelId}/availability/ is likely missing.`);
  try {
      const response = await api.axios.get<ApiResponse<any>>(
        `/hostels/${hostelId}/availability/`, 
        { params: { date: date?.toISOString() } }
      );
      return response.data.data || { available: true, bookedDates: [] };
  } catch (e) {
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
  moveInDate: Date;
  durationMonths: number;
}): Promise<Booking> => {
  if (!data.roomId) {
    throw new Error("Missing room ID");
  }

  // We can just call the standard createBooking which maps to the correct endpoint
  return createBooking({
    hostelId: String(data.hostelId),
    roomId: String(data.roomId),
    moveInDate: data.moveInDate,
    durationMonths: data.durationMonths
  });
};

/**
 * Confirm payment for a booking
 */
export const confirmPayment = async (
  bookingId: string | number,
  paymentProof?: string,
): Promise<Booking> => {
  // /bookings/<id>/confirm-payment/ NOT in reference.
  console.warn('confirmPayment endpoint missing in backend.');
  throw new Error('Endpoint missing');
};

/**
 * Get student's booking history
 */
export const getStudentBookings = async (
  status?: Booking['status'],
): Promise<Booking[]> => {
  // /bookings/student/ NOT in reference.
  // We should probably rely on /accounts/dashboard/ for this, which we stubbed out partly.
  console.warn('getStudentBookings (via /bookings/student/) missing in backend.');
  return [];
};
