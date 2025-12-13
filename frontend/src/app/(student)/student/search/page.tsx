'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Building2, Calendar, CreditCard, Users, ArrowRight, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useHostels } from '@/features/hostels';
import { useBookings } from '@/features/bookingss';
import { usePayments } from '@/features/payments';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery) {
        router.replace(`/student/search?q=${encodeURIComponent(searchQuery)}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, router]);

  // Fetch data based on search query
  const { data: hostelsResponse, isLoading: hostelsLoading } = useHostels({ 
    search: debouncedQuery 
  });
  const hostels = hostelsResponse?.results || [];
  
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { data: payments, isLoading: paymentsLoading } = usePayments();

  // Filter results based on search query
  const filteredBookings = React.useMemo(() => {
    if (!bookings || !debouncedQuery) return [];
    const query = debouncedQuery.toLowerCase();
    return bookings.filter(booking => 
      booking.hostelName?.toLowerCase().includes(query) ||
      booking.roomNumber?.toLowerCase().includes(query) ||
      booking.status?.toLowerCase().includes(query)
    );
  }, [bookings, debouncedQuery]);

  const filteredPayments = React.useMemo(() => {
    if (!payments || !debouncedQuery) return [];
    const query = debouncedQuery.toLowerCase();
    return payments.filter(payment => 
      payment.description?.toLowerCase().includes(query) ||
      payment.status?.toLowerCase().includes(query) ||
      payment.transactionId?.toLowerCase().includes(query)
    );
  }, [payments, debouncedQuery]);

  const hasResults = (hostels?.length ?? 0) > 0 || 
                     filteredBookings.length > 0 || 
                     filteredPayments.length > 0;

  const isLoading = hostelsLoading || bookingsLoading || paymentsLoading;

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    router.replace('/student/search');
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Search
        </h1>
        
        {/* Search Input */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search hostels, bookings, payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 h-12 text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {debouncedQuery && (
          <p className="text-sm text-muted-foreground">
            Showing results for: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{debouncedQuery}</span>
          </p>
        )}
      </div>

      <Separator />

      {/* Loading State */}
      {isLoading && debouncedQuery && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Query State */}
      {!debouncedQuery && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Start Searching
            </CardTitle>
            <CardDescription>
              Search across hostels, bookings, payments, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-2 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <Building2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <CardTitle className="text-base">Hostels</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Search for hostels by name, location, or amenities</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle className="text-base">Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Find your bookings by hostel or status</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                  <CardTitle className="text-base">Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Search transactions and receipts</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-orange-200 dark:hover:border-orange-800 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <Users className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
                  <CardTitle className="text-base">Roommates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Find and connect with roommates</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results State */}
      {!isLoading && debouncedQuery && !hasResults && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              We couldn't find anything matching "{debouncedQuery}". Try searching with different keywords or check the spelling.
            </p>
            <Button onClick={handleClearSearch} variant="outline" className="mt-4">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!isLoading && debouncedQuery && hasResults && (
        <div className="space-y-6">
          {/* Hostels Results */}
          {hostels && hostels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Hostels
                  <Badge variant="secondary" className="ml-auto">{hostels.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hostels.slice(0, 5).map((hostel) => (
                  <Link
                    key={hostel.id}
                    href={`/student/hostels/${hostel.slug || hostel.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {hostel.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {hostel.location || hostel.address}
                      </p>
                      {hostel.pricePerMonth && (
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                          KES {hostel.pricePerMonth.toLocaleString()}/month
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                  </Link>
                ))}
                {hostels.length > 5 && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/student/hostels">
                      View all {hostels.length} results
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bookings Results */}
          {filteredBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Bookings
                  <Badge variant="secondary" className="ml-auto">{filteredBookings.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredBookings.slice(0, 5).map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/student/bookings/${booking.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {booking.hostelName} - Room {booking.roomNumber}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Status: <span className={cn(
                          "font-medium",
                          booking.status === 'confirmed' && "text-green-600",
                          booking.status === 'pending' && "text-yellow-600",
                          booking.status === 'cancelled' && "text-red-600"
                        )}>
                          {booking.status}
                        </span>
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </Link>
                ))}
                {filteredBookings.length > 5 && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/student/bookings">
                      View all {filteredBookings.length} results
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payments Results */}
          {filteredPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Payments
                  <Badge variant="secondary" className="ml-auto">{filteredPayments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredPayments.slice(0, 5).map((payment) => (
                  <Link
                    key={payment.id}
                    href={`/student/payments/${payment.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {payment.description || 'Payment'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        KES {payment.amount?.toLocaleString()} • {payment.status}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  </Link>
                ))}
                {filteredPayments.length > 5 && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/student/payments">
                      View all {filteredPayments.length} results
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
