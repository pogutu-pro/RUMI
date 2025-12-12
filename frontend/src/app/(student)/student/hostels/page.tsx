'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Pagination } from '@/components/ui/pagination';
import { Search, Filter, SlidersHorizontal, Home } from 'lucide-react';
import { useHostels } from '@/hooks/use-hostels';
import { HostelCard } from '@/features/hostels';
import HostelFiltersPanel, {
  type FiltersState,
} from '@/features/hostels';

export default function StudentHostelsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [filters, setFilters] = React.useState<FiltersState>({});
  const [favorites, setFavorites] = React.useState<Set<number>>(new Set());

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

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const totalPages = data ? Math.ceil(data.count / 20) : 0;
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== '',
  );

  return (
    <div className="min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-card text-foreground p-8 md:p-12 lg:p-16 border">
        <div className="relative z-10 max-w-3xl space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Home className="h-3 w-3 mr-1" />
            Find Your Perfect Home
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Student Accommodation Made Easy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse verified hostels near your campus with premium amenities and
            transparent pricing.
          </p>
          {/* Search Bar */}
          <div className="flex gap-2 pt-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by hostel name, university, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-background border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 px-6 rounded-xl"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
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
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {data ? `${data.count} Hostels Found` : 'Available Hostels'}
          </h2>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing filtered results
            </p>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border bg-card">
              <Skeleton className="h-64 w-full rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-20 rounded-3xl bg-destructive/10 border-2 border-destructive/20">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">Error loading hostels</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            {error instanceof Error
              ? error.message
              : 'Something went wrong. Please try again.'}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Hostels Grid */}
      {!isLoading && !error && data && data.results.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.results.map((hostel) => (
              <HostelCard
                key={hostel.id}
                hostel={hostel}
                // isFavorite={favorites.has(hostel.id)} // HostelCard handles this internally or via props if needed, but new HostelCard might have different props. Checking HostelCard definition...
                // The new HostelCard (formerly Modern) takes: hostel, onFavoriteToggle, isFavorite, className.
                isFavorite={favorites.has(hostel.id)}
                onFavoriteToggle={toggleFavorite}
                basePath="/student/hostels"
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-8 w-full">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={20}
                totalItems={data.count}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && data && data.results.length === 0 && (
        <div className="text-center py-20 rounded-3xl bg-muted/30 border-2 border-dashed">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No hostels found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            We couldn&apos;t find any hostels matching your criteria. Try
            adjusting your filters or search terms.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={handleClearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
