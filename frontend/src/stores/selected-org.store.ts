import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Which organization the super_admin cross-org dashboard is currently
 * viewing. Meaningless for every other role — their data is already
 * server-side scoped to their own organization.
 */
interface SelectedOrgState {
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
}

export const useSelectedOrgStore = create<SelectedOrgState>()(
  persist(
    (set) => ({
      selectedOrgId: null,
      setSelectedOrgId: (id) => set({ selectedOrgId: id }),
    }),
    { name: 'rumia-selected-org' },
  ),
);
