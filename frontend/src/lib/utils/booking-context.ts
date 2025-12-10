/**
 * Booking Context Management Utilities
 * Handles preservation of booking data across login/profile creation redirects
 */

export interface BookingContextData {
  hostelId: string | number;
  hostelName: string;
  roomId?: string | number;
  moveInDate: string;
  durationMonths: number;
  totalPrice: number;
  timestamp: number;
}

const STORAGE_KEY = 'pendingBooking';
const EXPIRY_MINUTES = 30;

/**
 * Save booking context to sessionStorage
 * Context expires after 30 minutes
 */
export const saveBookingContext = (data: Omit<BookingContextData, 'timestamp'>): void => {
  const contextData: BookingContextData = {
    ...data,
    timestamp: Date.now(),
  };
  
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(contextData));
  } catch (error) {
    console.error('Failed to save booking context:', error);
  }
};

/**
 * Retrieve booking context from sessionStorage
 * Returns null if expired or not found
 */
export const getBookingContext = (): BookingContextData | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data: BookingContextData = JSON.parse(stored);
    
    // Check if expired (30 minutes)
    const expiryTime = EXPIRY_MINUTES * 60 * 1000;
    if (Date.now() - data.timestamp > expiryTime) {
      clearBookingContext();
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to retrieve booking context:', error);
    return null;
  }
};

/**
 * Clear booking context from sessionStorage
 */
export const clearBookingContext = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear booking context:', error);
  }
};

/**
 * Check if booking context exists
 */
export const hasBookingContext = (): boolean => {
  return getBookingContext() !== null;
};
