import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AvailableRoom,
  TransferRequest,
  TransferPolicy,
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
  // Available rooms
  availableRooms: AvailableRoom[];
  filteredRooms: AvailableRoom[];
  selectedRoom: AvailableRoom | null;
  filters: TransferFilters;

  // Transfer requests
  myTransfers: TransferRequest[];
  activeRequest: TransferRequest | null;
  transferHistory: TransferRequest[];

  // Transfer policy
  currentPolicy: TransferPolicy | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  currentStep: number; // For wizard (1, 2, 3)

  // Draft transfer data
  draftTransfer: {
    toRoomId: string | null;
    reason: TransferReason | null;
    reasonDetails: string;
    transferDate: Date | null;
  };

  // Actions
  setAvailableRooms: (rooms: AvailableRoom[]) => void;
  setFilters: (filters: Partial<TransferFilters>) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  setSelectedRoom: (room: AvailableRoom | null) => void;

  setMyTransfers: (transfers: TransferRequest[]) => void;
  setActiveRequest: (request: TransferRequest | null) => void;
  addTransferRequest: (request: TransferRequest) => void;
  updateTransferStatus: (id: string, status: string) => void;

  setTransferPolicy: (policy: TransferPolicy) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Wizard navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Draft management
  updateDraftTransfer: (data: Partial<TransferState['draftTransfer']>) => void;
  resetDraftTransfer: () => void;

  // Utility
  hasActiveRequest: () => boolean;
  canRequestTransfer: () => boolean;
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
      availableRooms: [],
      filteredRooms: [],
      selectedRoom: null,
      filters: initialFilters,

      myTransfers: [],
      activeRequest: null,
      transferHistory: [],

      currentPolicy: null,

      isLoading: false,
      error: null,
      currentStep: 1,

      draftTransfer: initialDraftTransfer,

      // Actions
      setAvailableRooms: (rooms) => {
        set({ availableRooms: rooms });
        get().applyFilters();
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        get().applyFilters();
      },

      applyFilters: () => {
        const { availableRooms, filters } = get();
        let filtered = [...availableRooms];

        // Price range filter
        if (filters.priceRange) {
          filtered = filtered.filter(
            (room) =>
              room.currentPrice >= filters.priceRange!.min &&
              room.currentPrice <= filters.priceRange!.max
          );
        }

        // Room type filter
        if (filters.roomTypes && filters.roomTypes.length > 0) {
          filtered = filtered.filter((room) =>
            filters.roomTypes!.includes(room.roomType)
          );
        }

        // Floor filter
        if (filters.floors && filters.floors.length > 0) {
          filtered = filtered.filter((room) =>
            filters.floors!.includes(room.floor)
          );
        }

        // Quiet floor filter
        if (filters.quietFloorOnly) {
          filtered = filtered.filter((room) => room.isQuietFloor);
        }

        // Roommate preference filter
        if (filters.roommatePreference === 'same') {
          filtered = filtered.filter(
            (room) => room.currentRoommate?.isCurrentRoommate
          );
        } else if (filters.roommatePreference === 'new') {
          filtered = filtered.filter(
            (room) => !room.currentRoommate?.isCurrentRoommate
          );
        }

        // Search query filter
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (room) =>
              room.roomNumber.toLowerCase().includes(query) ||
              room.hostelName.toLowerCase().includes(query)
          );
        }

        set({ filteredRooms: filtered });
      },

      resetFilters: () => {
        set({ filters: initialFilters });
        get().applyFilters();
      },

      setSelectedRoom: (room) => set({ selectedRoom: room }),

      setMyTransfers: (transfers) => {
        const active = transfers.find(
          (t) => t.status === 'pending' || t.status === 'approved'
        );
        const history = transfers.filter(
          (t) => t.status === 'rejected' || t.status === 'cancelled'
        );

        set({
          myTransfers: transfers,
          activeRequest: active || null,
          transferHistory: history,
        });
      },

      setActiveRequest: (request) => set({ activeRequest: request }),

      addTransferRequest: (request) => {
        set((state) => ({
          myTransfers: [request, ...state.myTransfers],
          activeRequest: request,
        }));
      },

      updateTransferStatus: (id, status) => {
        set((state) => {
          const updatedTransfers = state.myTransfers.map((t) =>
            t.id === id ? { ...t, status: status as any } : t
          );

          const active = updatedTransfers.find(
            (t) => t.status === 'pending' || t.status === 'approved'
          );
          const history = updatedTransfers.filter(
            (t) =>
              t.status === 'rejected' ||
              t.status === 'cancelled'
          );

          return {
            myTransfers: updatedTransfers,
            activeRequest: active || null,
            transferHistory: history,
          };
        });
      },

      setTransferPolicy: (policy) => set({ currentPolicy: policy }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

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

      // Utility
      hasActiveRequest: () => {
        const { activeRequest } = get();
        return activeRequest !== null;
      },

      canRequestTransfer: () => {
        const { activeRequest } = get();
        return activeRequest === null || activeRequest.status === 'rejected';
      },

      reset: () =>
        set({
          availableRooms: [],
          filteredRooms: [],
          selectedRoom: null,
          filters: initialFilters,
          myTransfers: [],
          activeRequest: null,
          transferHistory: [],
          currentPolicy: null,
          isLoading: false,
          error: null,
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

/**
 * ================================================================================
 * README: Transfer Store (transfer.store.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Manages room transfer workflow: available rooms, filters, transfer requests,
 * and multi-step wizard state. Full persistence for draft transfers.
 *
 * STATE:
 * ------
 * | Field           | Type              | Purpose                           |
 * |-----------------|-------------------|-----------------------------------|
 * | availableRooms  | AvailableRoom[]   | All rooms available for transfer  |
 * | filteredRooms   | AvailableRoom[]   | Rooms after applying filters      |
 * | selectedRoom    | AvailableRoom     | Selected destination room         |
 * | filters         | TransferFilters   | Price, type, floor, roommate pref |
 * | myTransfers     | TransferRequest[] | User's transfer requests          |
 * | activeRequest   | TransferRequest   | Currently pending/approved request|
 * | currentStep     | 1 | 2 | 3         | Wizard step                       |
 * | draftTransfer   | object            | In-progress transfer form data    |
 *
 * FILTER OPTIONS:
 * ---------------
 * - priceRange: { min, max }
 * - roomTypes: ['single', 'double', 'triple', 'quad']
 * - floors: number[]
 * - quietFloorOnly: boolean
 * - roommatePreference: 'same' | 'new' | 'any'
 * - searchQuery: string
 *
 * ACTIONS:
 * --------
 * Room Selection:
 * - setAvailableRooms(), setSelectedRoom()
 * - setFilters(), applyFilters(), resetFilters()
 *
 * Transfer Requests:
 * - setMyTransfers(), addTransferRequest(), updateTransferStatus()
 *
 * Wizard Navigation:
 * - setCurrentStep(), nextStep(), prevStep()
 * - updateDraftTransfer(), resetDraftTransfer()
 *
 * Utilities:
 * - hasActiveRequest(), canRequestTransfer(), reset()
 *
 * PERSISTENCE:
 * ------------
 * Key: 'transfer-storage'
 * Persists: filters, draftTransfer, currentStep
 *
 * USAGE:
 * ------
 * ```typescript
 * import { useTransferStore } from '@/stores/transfer.store';
 *
 * const { filteredRooms, setFilters, selectedRoom, nextStep } = useTransferStore();
 *
 * setFilters({ roomTypes: ['single'], quietFloorOnly: true });
 * ```
 *
 * ================================================================================
 */

