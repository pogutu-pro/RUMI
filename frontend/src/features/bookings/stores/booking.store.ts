// src/stores/booking.store.ts
import { create } from 'zustand';
import type { Booking } from '@/types/entities.types';

interface BookingState {
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;
  updateStatus: (status: Booking['status']) => void;
}

export const useCurrentBookingStore = create<BookingState>((set) => ({
  currentBooking: null,
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  updateStatus: (status) =>
    set((state) => ({
      currentBooking: state.currentBooking
        ? { ...state.currentBooking, status }
        : null,
    })),
}));

