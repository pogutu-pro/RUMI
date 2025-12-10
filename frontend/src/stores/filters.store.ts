// src/stores/filters.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FiltersState {
  priceRange: [number, number];
  amenities: string[];
  sort: 'popularity' | 'price_asc' | 'price_desc' | 'rating' | 'distance';
  searchQuery: string;
  setPriceRange: (range: [number, number]) => void;
  toggleAmenity: (amenity: string) => void;
  setSort: (sort: FiltersState['sort']) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      priceRange: [0, 50000],
      amenities: [],
      sort: 'popularity',
      searchQuery: '',
      setPriceRange: (range) => set({ priceRange: range }),
      toggleAmenity: (amenity) => {
        const amenities = get().amenities;
        set({
          amenities: amenities.includes(amenity)
            ? amenities.filter((a) => a !== amenity)
            : [...amenities, amenity],
        });
      },
      setSort: (sort) => set({ sort }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      resetFilters: () =>
        set({
          priceRange: [0, 50000],
          amenities: [],
          sort: 'popularity',
          searchQuery: '',
        }),
    }),
    { name: 'filters-storage' },
  ),
);


