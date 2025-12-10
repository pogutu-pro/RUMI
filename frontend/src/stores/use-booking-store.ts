import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BookingStep = 'selection' | 'profile_check' | 'payment' | 'success';

interface BookingState {
  // Flow State
  currentStep: BookingStep;
  isMobileSheetOpen: boolean;
  isBookingInProgress: boolean; // Persisted flag to track if user was in booking flow
  bookingType: 'solo' | 'invite';
  inviteCode: string | null;
  
  // Selection State
  selectedRoomId: string | null;
  moveInDate: Date | undefined;
  durationMonths: number;
  
  // Payment State
  paymentTimerStartedAt: number | null; // Timestamp
  isPaymentVerified: boolean;
  
  // Actions
  setStep: (step: BookingStep) => void;
  setMobileSheetOpen: (isOpen: boolean) => void;
  setBookingInProgress: (isInProgress: boolean) => void;
  setBookingType: (type: 'solo' | 'invite') => void;
  setInviteCode: (code: string | null) => void;
  selectRoom: (roomId: string) => void;
  setMoveInDate: (date: Date | undefined) => void;
  setDurationMonths: (months: number) => void;
  startPaymentTimer: () => void;
  resetPaymentTimer: () => void;
  setPaymentVerified: (verified: boolean) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      currentStep: 'selection',
      isMobileSheetOpen: false,
      isBookingInProgress: false,
      bookingType: 'solo',
      inviteCode: null,
      
      selectedRoomId: null,
      moveInDate: undefined,
      durationMonths: 1,
      
      paymentTimerStartedAt: null,
      isPaymentVerified: false,
      
      setStep: (step) => set({ currentStep: step }),
      setMobileSheetOpen: (isOpen) => set({ isMobileSheetOpen: isOpen }),
      setBookingInProgress: (isInProgress) => set({ isBookingInProgress: isInProgress }),
      setBookingType: (type) => set({ bookingType: type }),
      setInviteCode: (code) => set({ inviteCode: code }),
      selectRoom: (roomId) => set({ selectedRoomId: roomId }),
      setMoveInDate: (date) => set({ moveInDate: date }),
      setDurationMonths: (months) => set({ durationMonths: months }),
      
      startPaymentTimer: () => set({ paymentTimerStartedAt: Date.now() }),
      resetPaymentTimer: () => set({ paymentTimerStartedAt: null }),
      setPaymentVerified: (verified) => set({ isPaymentVerified: verified }),
      
      resetBooking: () => set({
        currentStep: 'selection',
        selectedRoomId: null,
        moveInDate: undefined,
        durationMonths: 1,
        paymentTimerStartedAt: null,
        isPaymentVerified: false,
        isMobileSheetOpen: false,
        isBookingInProgress: false,
        bookingType: 'solo',
        inviteCode: null,
      }),
    }),
    {
      name: 'rumi-booking-storage',
      partialize: (state) => ({
        // Persist selection state AND progress flag
        selectedRoomId: state.selectedRoomId,
        moveInDate: state.moveInDate,
        durationMonths: state.durationMonths,
        isBookingInProgress: state.isBookingInProgress,
      }),
    }
  )
);
