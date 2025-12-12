'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HostelList } from '@/features/hostels';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useHostels } from '@/hooks/use-hostels';

export default function Page() {
  const [query, setQuery] = React.useState('');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useHostels({ search: query || undefined });

  const hostels = data?.results || [];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          New booking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for a hostel, review room options, and start a new booking.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Find a hostel
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <Input
            type="search"
            placeholder="Search hostels by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <LoadingSpinner className="h-3 w-3 text-emerald-600" />
              <span>Searching hostels…</span>
            </div>
          )}
          {error && !isLoading && (
            <div className="text-[11px] text-red-600">
              Failed to load hostels.{' '}
              <button
                type="button"
                onClick={() => refetch()}
                className="underline"
              >
                Try again
              </button>
              .
            </div>
          )}
        </CardContent>
      </Card>

      <HostelList hostels={hostels} basePath="/student/hostels" />

      <div className="flex justify-end">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled
        >
          Continue to booking
        </Button>
      </div>
    </div>
  );
}
