'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Pagination } from '@/components/ui/pagination';
import Link from 'next/link';
import { Search, SlidersHorizontal, Building2, Star, ArrowRightLeft } from 'lucide-react';
import { useHostels } from '@/features/hostels';
import {
  HostelCard,
  HostelFiltersPanel,
  type FiltersState,
} from '@/features/hostels';

export default function StudentHostelsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [filters, setFilters] = React.useState<FiltersState>({});
  
  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useHostels({
    search: debouncedSearch,
    page: currentPage,
    ...filters,
  });

  const hostels = data?.results ?? [];

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const totalPages = data ? Math.ceil(data.count / 20) : 0;
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== '',
  );

  return (
    <div className="min-h-screen space-y-10 pb-16">
      {/* Search & Header Section */}
      <div className="border-b border-border/50 pb-10">
        <div className="max-w-4xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Hostel Directory
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Browse and filter through verified student accommodations near your academic institution.
            </p>
          </div>
          
          {/* Search Bar & Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, university, or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 bg-muted/20 border-border/50 text-foreground font-medium rounded-xl"
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 px-5 rounded-xl font-bold border-border/50"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter Options
                    {hasActiveFilters && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                        {
                          Object.values(filters).filter(
                            (v) => v !== undefined && v !== '',
                          ).length
                        }
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-md overflow-y-auto"
                >
                  <HostelFiltersPanel
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={handleClearFilters}
                    className="mt-6"
                  />
                </SheetContent>
              </Sheet>
            </div>

            {/* Quick Access Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="rounded-full h-9 px-4 font-bold text-xs bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10"
              >
                <Link href="/student/hostels/favorites">
                  <Star className="h-3.5 w-3.5 mr-2 fill-current" />
                  My Favorites
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="rounded-full h-9 px-4 font-bold text-xs bg-muted/50 hover:bg-muted text-muted-foreground border border-border/50"
              >
                <Link href="/student/hostels/compare">
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                  Compare Hostels
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            {data ? `${data.count} Verified Listings` : 'Available Listings'}
          </h2>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card">
                <Skeleton className="h-56 w-full rounded-t-xl" />
                <div className="p-5 space-y-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20 rounded-2xl bg-muted/20 border-2 border-dashed border-border/50">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold">Failed to load listings</h3>
            <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto mt-2">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred while fetching the hostel directory.'}
            </p>
            <Button
              variant="outline"
              className="mt-8 font-bold px-8 h-10 border-border/50"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </div>
        )}

        {/* Hostels Grid */}
        {!isLoading && !error && hostels.length > 0 && (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {hostels.map((hostel) => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  basePath="/student/hostels"
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-12 w-full">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={20}
                  totalItems={data?.count ?? 0}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && data && hostels.length === 0 && (
          <div className="text-center py-20 rounded-2xl bg-muted/20 border-2 border-dashed border-border/50">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold">No results found</h3>
            <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto mt-2">
              No accommodations match your current search parameters. Provide a different inquiry or adjust your filtering criteria.
            </p>
            <Button
              variant="outline"
              className="mt-8 font-bold px-8 h-10 border-border/50"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
