import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserFilters {
  search: string;
  role: 'all' | 'student' | 'landlord' | 'caretaker' | 'admin';
  status: 'all' | 'active' | 'suspended' | 'inactive';
  verificationStatus?: 'all' | 'verified' | 'pending' | 'rejected';
}

export interface HostelFilters {
  search: string;
  approvalStatus: 'all' | 'approved' | 'pending' | 'rejected';
  location: string;
  landlordId?: string;
}

export interface PaymentFilters {
  search: string;
  status: 'all' | 'completed' | 'pending' | 'failed' | 'disputed';
  dateRange?: {
    from: Date;
    to: Date;
  };
}

interface AdminState {
  // Filters
  userFilters: UserFilters;
  hostelFilters: HostelFilters;
  paymentFilters: PaymentFilters;

  // Selected items
  selectedUserId: string | null;
  selectedHostelId: string | null;
  selectedPaymentId: string | null;

  // UI state
  activeView: 'table' | 'grid' | 'map';

  // Actions
  setUserFilters: (filters: Partial<UserFilters>) => void;
  resetUserFilters: () => void;
  
  setHostelFilters: (filters: Partial<HostelFilters>) => void;
  resetHostelFilters: () => void;
  
  setPaymentFilters: (filters: Partial<PaymentFilters>) => void;
  resetPaymentFilters: () => void;

  setSelectedUser: (id: string | null) => void;
  setSelectedHostel: (id: string | null) => void;
  setSelectedPayment: (id: string | null) => void;

  setActiveView: (view: 'table' | 'grid' | 'map') => void;
}

const defaultUserFilters: UserFilters = {
  search: '',
  role: 'all',
  status: 'all',
  verificationStatus: 'all',
};

const defaultHostelFilters: HostelFilters = {
  search: '',
  approvalStatus: 'all',
  location: '',
};

const defaultPaymentFilters: PaymentFilters = {
  search: '',
  status: 'all',
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      // Initial state
      userFilters: defaultUserFilters,
      hostelFilters: defaultHostelFilters,
      paymentFilters: defaultPaymentFilters,
      selectedUserId: null,
      selectedHostelId: null,
      selectedPaymentId: null,
      activeView: 'table',

      // Filter actions
      setUserFilters: (filters) =>
        set((state) => ({
          userFilters: { ...state.userFilters, ...filters },
        })),
      resetUserFilters: () => set({ userFilters: defaultUserFilters }),

      setHostelFilters: (filters) =>
        set((state) => ({
          hostelFilters: { ...state.hostelFilters, ...filters },
        })),
      resetHostelFilters: () => set({ hostelFilters: defaultHostelFilters }),

      setPaymentFilters: (filters) =>
        set((state) => ({
          paymentFilters: { ...state.paymentFilters, ...filters },
        })),
      resetPaymentFilters: () => set({ paymentFilters: defaultPaymentFilters }),

      // Selection actions
      setSelectedUser: (id) => set({ selectedUserId: id }),
      setSelectedHostel: (id) => set({ selectedHostelId: id }),
      setSelectedPayment: (id) => set({ selectedPaymentId: id }),

      // UI actions
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        activeView: state.activeView,
        userFilters: state.userFilters,
        hostelFilters: state.hostelFilters,
        paymentFilters: state.paymentFilters,
      }),
    }
  )
);

// Selectors for easier access
export const useAdminFilters = () => {
  const userFilters = useAdminStore((state) => state.userFilters);
  const hostelFilters = useAdminStore((state) => state.hostelFilters);
  const paymentFilters = useAdminStore((state) => state.paymentFilters);
  return { userFilters, hostelFilters, paymentFilters };
};

export const useAdminSelections = () => {
  const selectedUserId = useAdminStore((state) => state.selectedUserId);
  const selectedHostelId = useAdminStore((state) => state.selectedHostelId);
  const selectedPaymentId = useAdminStore((state) => state.selectedPaymentId);
  const setSelectedUser = useAdminStore((state) => state.setSelectedUser);
  const setSelectedHostel = useAdminStore((state) => state.setSelectedHostel);
  const setSelectedPayment = useAdminStore((state) => state.setSelectedPayment);
  
  return {
    selectedUserId,
    selectedHostelId,
    selectedPaymentId,
    setSelectedUser,
    setSelectedHostel,
    setSelectedPayment,
  };
};
