import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TenantFilters,
  MaintenanceFilters,
  SecurityFilters,
  CheckInFormState,
  CheckOutFormState,
} from '@/types/caretaker.types';

interface CaretakerState {
  // Filters
  tenantFilters: TenantFilters;
  maintenanceFilters: MaintenanceFilters;
  securityFilters: SecurityFilters;

  // Check-in/out state
  checkInState: CheckInFormState | null;
  checkOutState: CheckOutFormState | null;

  // Selected items
  selectedTenantId: string | null;
  selectedRoomId: string | null;
  selectedMaintenanceId: string | null;

  // UI state
  activeView: 'grid' | 'list';

  // Actions
  setTenantFilters: (filters: Partial<TenantFilters>) => void;
  resetTenantFilters: () => void;
  setMaintenanceFilters: (filters: Partial<MaintenanceFilters>) => void;
  resetMaintenanceFilters: () => void;
  setSecurityFilters: (filters: Partial<SecurityFilters>) => void;
  resetSecurityFilters: () => void;

  setCheckInState: (state: Partial<CheckInFormState> | null) => void;
  setCheckOutState: (state: Partial<CheckOutFormState> | null) => void;
  resetCheckInState: () => void;
  resetCheckOutState: () => void;

  setSelectedTenant: (id: string | null) => void;
  setSelectedRoom: (id: string | null) => void;
  setSelectedMaintenance: (id: string | null) => void;

  setActiveView: (view: 'grid' | 'list') => void;
}

const defaultTenantFilters: TenantFilters = {
  search: '',
  paymentStatus: 'all',
  roomNumber: '',
  status: 'active',
};

const defaultMaintenanceFilters: MaintenanceFilters = {
  status: 'all',
  priority: 'all',
  category: 'all',
  roomNumber: '',
};

const defaultSecurityFilters: SecurityFilters = {
  type: 'all',
};

export const useCaretakerStore = create<CaretakerState>()(
  persist(
    (set) => ({
      // Initial state
      tenantFilters: defaultTenantFilters,
      maintenanceFilters: defaultMaintenanceFilters,
      securityFilters: defaultSecurityFilters,
      checkInState: null,
      checkOutState: null,
      selectedTenantId: null,
      selectedRoomId: null,
      selectedMaintenanceId: null,
      activeView: 'grid',

      // Filter actions
      setTenantFilters: (filters) =>
        set((state) => ({
          tenantFilters: { ...state.tenantFilters, ...filters },
        })),
      resetTenantFilters: () => set({ tenantFilters: defaultTenantFilters }),

      setMaintenanceFilters: (filters) =>
        set((state) => ({
          maintenanceFilters: { ...state.maintenanceFilters, ...filters },
        })),
      resetMaintenanceFilters: () => set({ maintenanceFilters: defaultMaintenanceFilters }),

      setSecurityFilters: (filters) =>
        set((state) => ({
          securityFilters: { ...state.securityFilters, ...filters },
        })),
      resetSecurityFilters: () => set({ securityFilters: defaultSecurityFilters }),

      // Check-in/out actions
      setCheckInState: (state) =>
        set((current) => ({
          checkInState: state ? { ...current.checkInState, ...state } as CheckInFormState : null,
        })),
      setCheckOutState: (state) =>
        set((current) => ({
          checkOutState: state ? { ...current.checkOutState, ...state } as CheckOutFormState : null,
        })),
      resetCheckInState: () => set({ checkInState: null }),
      resetCheckOutState: () => set({ checkOutState: null }),

      // Selection actions
      setSelectedTenant: (id) => set({ selectedTenantId: id }),
      setSelectedRoom: (id) => set({ selectedRoomId: id }),
      setSelectedMaintenance: (id) => set({ selectedMaintenanceId: id }),

      // UI actions
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'caretaker-storage',
      partialize: (state) => ({
        activeView: state.activeView,
        tenantFilters: state.tenantFilters,
        maintenanceFilters: state.maintenanceFilters,
      }),
    }
  )
);

// Selectors for easier access
export const useCaretakerFilters = () => {
  const tenantFilters = useCaretakerStore((state) => state.tenantFilters);
  const maintenanceFilters = useCaretakerStore((state) => state.maintenanceFilters);
  const securityFilters = useCaretakerStore((state) => state.securityFilters);
  return { tenantFilters, maintenanceFilters, securityFilters };
};

export const useCheckInOutState = () => {
  const checkInState = useCaretakerStore((state) => state.checkInState);
  const checkOutState = useCaretakerStore((state) => state.checkOutState);
  const setCheckInState = useCaretakerStore((state) => state.setCheckInState);
  const setCheckOutState = useCaretakerStore((state) => state.setCheckOutState);
  const resetCheckInState = useCaretakerStore((state) => state.resetCheckInState);
  const resetCheckOutState = useCaretakerStore((state) => state.resetCheckOutState);
  
  return {
    checkInState,
    checkOutState,
    setCheckInState,
    setCheckOutState,
    resetCheckInState,
    resetCheckOutState,
  };
};
