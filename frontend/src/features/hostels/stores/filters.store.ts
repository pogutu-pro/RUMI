// src/stores/filters.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FiltersState {
  priceRange: [number, number];
  amenities: string[];
  sort: 'popularity' | 'price_asc' | 'price_desc' | 'rating' | 'distance';
  searchQuery: string;
  university?: string;
  city?: string;
  hostel_type?: string;
  gender_policy?: string;
  setPriceRange: (range: [number, number]) => void;
  toggleAmenity: (amenity: string) => void;
  setSort: (sort: FiltersState['sort']) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (key: keyof FiltersState, value: any) => void;
  resetFilters: () => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      priceRange: [0, 50000],
      amenities: [],
      sort: 'popularity',
      searchQuery: '',
      university: undefined,
      city: undefined,
      hostel_type: undefined,
      gender_policy: undefined,
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
      setFilter: (key, value) => set({ [key]: value } as any),
      resetFilters: () =>
        set({
          priceRange: [0, 50000],
          amenities: [],
          sort: 'popularity',
          searchQuery: '',
          university: undefined,
          city: undefined,
          hostel_type: undefined,
          gender_policy: undefined,
        }),
    }),
    { name: 'filters-storage' },
  ),
);


