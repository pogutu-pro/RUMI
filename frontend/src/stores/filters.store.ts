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

/**
 * ================================================================================
 * README: Filters Store (filters.store.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Manages hostel search and filter state for hostel listing pages.
 * Persists filter preferences to localStorage.
 *
 * STATE:
 * ------
 * | Field        | Type                  | Purpose                          |
 * |--------------|----------------------|----------------------------------|
 * | priceRange   | [number, number]     | Min/max price filter (0-50000)   |
 * | amenities    | string[]             | Selected amenity filters         |
 * | sort         | string               | Sort order preference            |
 * | searchQuery  | string               | Text search query                |
 *
 * SORT OPTIONS:
 * -------------
 * - 'popularity' (default)
 * - 'price_asc' / 'price_desc'
 * - 'rating'
 * - 'distance'
 *
 * ACTIONS:
 * --------
 * | Action          | Description                          |
 * |-----------------|--------------------------------------|
 * | setPriceRange() | Update price filter                  |
 * | toggleAmenity() | Add/remove amenity from filter       |
 * | setSort()       | Change sort order                    |
 * | setSearchQuery()| Update search text                   |
 * | resetFilters()  | Reset all to defaults                |
 *
 * PERSISTENCE:
 * ------------
 * Key: 'filters-storage'
 * Persists all filter state
 *
 * USAGE:
 * ------
 * ```typescript
 * import { useFiltersStore } from '@/stores/filters.store';
 *
 * const { priceRange, amenities, sort, setPriceRange, toggleAmenity } = useFiltersStore();
 *
 * setPriceRange([5000, 20000]);
 * toggleAmenity('wifi');
 * ```
 *
 * ================================================================================
 */

