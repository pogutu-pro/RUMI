import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  TransferReason,
} from '@/types/entities.types';

interface TransferFilters {
  priceRange?: {
    min: number;
    max: number;
  };
  roomTypes?: ('single' | 'double' | 'triple' | 'quad')[];
  floors?: number[];
  quietFloorOnly?: boolean;
  roommatePreference?: 'same' | 'new' | 'any';
  searchQuery?: string;
}

interface TransferState {
  // Client State / Filters
  filters: TransferFilters;
  
  // UI state
  currentStep: number; // For wizard (1, 2, 3)

  // Draft transfer data
  draftTransfer: {
    toRoomId: string | null;
    reason: TransferReason | null;
    reasonDetails: string;
    transferDate: Date | null;
  };

  // Actions
  setFilters: (filters: Partial<TransferFilters>) => void;
  resetFilters: () => void;

  // Wizard navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Draft management
  updateDraftTransfer: (data: Partial<TransferState['draftTransfer']>) => void;
  resetDraftTransfer: () => void;

  reset: () => void;
}

const initialFilters: TransferFilters = {
  priceRange: undefined,
  roomTypes: undefined,
  floors: undefined,
  quietFloorOnly: false,
  roommatePreference: 'any',
  searchQuery: '',
};

const initialDraftTransfer: TransferState['draftTransfer'] = {
  toRoomId: null,
  reason: null,
  reasonDetails: '',
  transferDate: null,
};

export const useTransferStore = create<TransferState>()(
  persist(
    (set, get) => ({
      // Initial state
      filters: initialFilters,
      currentStep: 1,
      draftTransfer: initialDraftTransfer,

      // Actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      resetFilters: () => {
        set({ filters: initialFilters });
      },

      // Wizard navigation
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () =>
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      // Draft management
      updateDraftTransfer: (data) =>
        set((state) => ({
          draftTransfer: { ...state.draftTransfer, ...data },
        })),

      resetDraftTransfer: () => set({ draftTransfer: initialDraftTransfer }),

      reset: () =>
        set({
          filters: initialFilters,
          currentStep: 1,
          draftTransfer: initialDraftTransfer,
        }),
    }),
    {
      name: 'transfer-storage',
      partialize: (state) => ({
        filters: state.filters,
        draftTransfer: state.draftTransfer,
        currentStep: state.currentStep,
      }),
    }
  )
);
