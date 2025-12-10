// src/stores/booking.store.ts
import { create } from 'zustand';
import type { Booking } from '@/types/entities.types';

interface BookingState {
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;
  updateStatus: (status: Booking['status']) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  currentBooking: null,
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  updateStatus: (status) =>
    set((state) => ({
      currentBooking: state.currentBooking
        ? { ...state.currentBooking, status }
        : null,
    })),
}));

/**
 * ================================================================================
 * README: Booking Store (booking.store.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Simple store for managing the currently active booking.
 * Used for tracking booking state across components.
 *
 * STATE:
 * ------
 * | Field          | Type          | Purpose                      |
 * |----------------|---------------|------------------------------|
 * | currentBooking | Booking|null  | Currently active booking     |
 *
 * ACTIONS:
 * --------
 * | Action             | Description                        |
 * |--------------------|------------------------------------|
 * | setCurrentBooking()| Set or clear current booking       |
 * | updateStatus()     | Update booking status in place     |
 *
 * USAGE:
 * ------
 * ```typescript
 * import { useBookingStore } from '@/stores/booking.store';
 *
 * const { currentBooking, setCurrentBooking, updateStatus } = useBookingStore();
 *
 * setCurrentBooking(bookingData);
 * updateStatus('confirmed');
 * ```
 *
 * ================================================================================
 */

