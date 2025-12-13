
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Hostel } from '@/features/hostels';

interface StudentState {
  // Favorites
  favorites: Hostel[];
  addFavorite: (hostel: Hostel) => void;
  removeFavorite: (hostelId: number) => void;
  isFavorite: (hostelId: number) => boolean;
  setFavorites: (hostels: Hostel[]) => void;

  // Comparison
  compareList: Hostel[];
  addToCompare: (hostel: Hostel) => boolean; // Returns true if added, false if full
  removeFromCompare: (hostelId: number) => void;
  clearCompare: () => void;
  isInCompare: (hostelId: number) => boolean;
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      // Favorites Implementation
      favorites: [],
      
      addFavorite: (hostel) => {
        const { favorites } = get();
        if (!favorites.some((h) => h.id === hostel.id)) {
          set({ favorites: [...favorites, hostel] });
        }
      },

      removeFavorite: (hostelId) => {
        set((state) => ({
          favorites: state.favorites.filter((h) => h.id !== hostelId),
        }));
      },

      isFavorite: (hostelId) => {
        return get().favorites.some((h) => h.id === hostelId);
      },

      setFavorites: (hostels) => {
        set({ favorites: hostels });
      },

      // Comparison Implementation
      compareList: [],

      addToCompare: (hostel) => {
        const { compareList } = get();
        // Check if already in list
        if (compareList.some((h) => h.id === hostel.id)) {
          return true; // Already added, success
        }
        
        // Limit to 3
        if (compareList.length >= 3) {
          return false; // Full
        }

        set({ compareList: [...compareList, hostel] });
        return true;
      },

      removeFromCompare: (hostelId) => {
        set((state) => ({
          compareList: state.compareList.filter((h) => h.id !== hostelId),
        }));
      },

      clearCompare: () => {
        set({ compareList: [] });
      },

      isInCompare: (hostelId) => {
        return get().compareList.some((h) => h.id === hostelId);
      },
    }),
    {
      name: 'student-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        favorites: state.favorites,
        compareList: state.compareList 
      }),
    }
  )
);
