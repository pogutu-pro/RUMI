'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SlidersHorizontal, 
  X,
  Sparkles,
  Home
} from 'lucide-react';

import HostelSort from './hostel-sort';
import HostelGrid from './hostel-grid';
import { HostelFiltersPanel, type FiltersState } from './hostel-filters-panel';
import { useFiltersStore } from '@/features/hostels';
import { getHostels, type HostelsResponse } from '@/features/hostels';
import type { Hostel } from '@/types/entities.types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * HostelsView - Main discovery page for browsing hostels
 * Airbnb-inspired design with filters, sorting, and grid layout
 */
export function HostelsView() {
  const { 
    priceRange,
    amenities,
    searchQuery,
    sort,
    setPriceRange,
    toggleAmenity,
    setSearchQuery,
    resetFilters,
    university,
    city,
    hostel_type,
    gender_policy,
    setFilter
  } = useFiltersStore();
  
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);

  // Combine store and local filters for API
  const apiFilters = React.useMemo(() => {
    // Map frontend sort keys to backend 'ordering' parameter
    let ordering = undefined;
    if (sort === 'price_asc') ordering = 'price';
    else if (sort === 'price_desc') ordering = '-price';
    else if (sort === 'rating') ordering = '-rating';
    
    return {
      university,
      city,
      hostel_type,
      gender_policy,
      min_price: priceRange[0],
      max_price: priceRange[1],
      amenities: amenities.length > 0 ? amenities.join(',') : undefined,
      search: searchQuery || undefined,
      ordering,
    };
  }, [university, city, hostel_type, gender_policy, priceRange, amenities, searchQuery, sort]);
  
  const {
    data,
    isLoading,
    error,
  } = useQuery<HostelsResponse, Error>({
    queryKey: ['hostels', apiFilters, sort],
    queryFn: () => getHostels(apiFilters),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const hostels = data?.results || [];

  const handleFiltersChange = (newFilters: FiltersState) => {
    // Sync everything to store
    if (newFilters.university !== undefined) setFilter('university', newFilters.university);
    if (newFilters.city !== undefined) setFilter('city', newFilters.city);
    if (newFilters.hostel_type !== undefined) setFilter('hostel_type', newFilters.hostel_type);
    if (newFilters.gender_policy !== undefined) setFilter('gender_policy', newFilters.gender_policy);
    
    if (newFilters.min_price !== undefined && newFilters.max_price !== undefined) {
      setPriceRange([newFilters.min_price, newFilters.max_price]);
    }

    // For amenities, since store has toggle but panel passes full list:
    if (newFilters.amenities !== undefined) {
      setFilter('amenities', newFilters.amenities);
    }
  };

  const handleClearFilters = () => {
    resetFilters();
  };

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (university) count++;
    if (city) count++;
    if (hostel_type) count++;
    if (gender_policy) count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 50000) count++;
    if (amenities.length > 0) count += amenities.length;
    if (searchQuery) count++;
    return count;
  }, [university, city, hostel_type, gender_policy, priceRange, amenities, searchQuery]);

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-4 text-6xl">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't load the hostels. Please try again later.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            Reload page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar - Sticky below header */}
      <div className="sticky top-[72px] md:top-[68px] z-30 bg-white border-b shadow-sm transition-all">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 gap-4">
            {/* Results Count */}
            <div className="flex items-center gap-3">
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="relative h-10 gap-2 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900 transition-all font-medium rounded-md shadow-sm"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-gray-900 text-white text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md p-0">
                  <HostelFiltersPanel
                    filters={{
                      university,
                      city,
                      hostel_type,
                      gender_policy,
                      min_price: priceRange[0],
                      max_price: priceRange[1],
                      amenities: amenities
                    }}
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={handleClearFilters}
                    onClose={() => setIsFiltersOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              {!isLoading && (
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{hostels.length}</span>
                    {' '}hostels found
                  </p>
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <HostelSort />
            </div>
          </div>

          {/* Active Filters Pills */}
          <AnimatePresence>
            {activeFiltersCount > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    Active filters:
                  </span>
                  {university && (
                    <Badge 
                      variant="secondary" 
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 whitespace-nowrap"
                    >
                      🎓 {university}
                      <button
                        onClick={() => setFilter('university', undefined)}
                        className="ml-1 hover:text-emerald-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {city && (
                    <Badge 
                      variant="secondary" 
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 whitespace-nowrap"
                    >
                      📍 {city}
                      <button
                        onClick={() => setFilter('city', undefined)}
                        className="ml-1 hover:text-emerald-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {hostel_type && (
                    <Badge 
                      variant="secondary" 
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 whitespace-nowrap"
                    >
                      🏠 {hostel_type.replace('_', ' ')}
                      <button
                        onClick={() => setFilter('hostel_type', undefined)}
                        className="ml-1 hover:text-emerald-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {gender_policy && (
                    <Badge 
                      variant="secondary" 
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 whitespace-nowrap"
                    >
                      👥 {gender_policy.replace('_', ' ')}
                      <button
                        onClick={() => setFilter('gender_policy', undefined)}
                        className="ml-1 hover:text-emerald-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {amenities?.map((amenity) => (
                    <Badge 
                      key={amenity}
                      variant="secondary" 
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 whitespace-nowrap"
                    >
                      ✨ {amenity}
                      <button
                        onClick={() => toggleAmenity(amenity)}
                        className="ml-1 hover:text-emerald-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs text-gray-400 hover:text-gray-900 h-auto py-1 whitespace-nowrap"
                  >
                    Clear all
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-3"
              >
                <div className="aspect-[20/19] bg-gray-100 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : hostels.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <div className="mb-6 text-7xl">🏠</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No hostels found
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {activeFiltersCount > 0 
                ? "Try adjusting your search filters to find more options."
                : "We couldn't find any hostels matching your criteria."
              }
            </p>
            {activeFiltersCount > 0 && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="mt-4"
              >
                Clear all filters
              </Button>
            )}
          </motion.div>
        ) : (
          /* Results Grid */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <HostelGrid hostels={hostels} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
