'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { 
  RoomTransferCard, 
  TransferFilters,
  TransferSkeleton,
  NoResultsState,
  EmptyState,
} from '@/features/transfers';
import { useTransferStore } from '@/features/transfers';
import { useAvailableRooms } from '@/features/transfers/hooks/use-transfers-query';

export default function AvailableRoomsPage() {
  const router = useRouter();
  const {
    setFilters,
    filters
  } = useTransferStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch available rooms using React Query
  // TODO: Replace 'default-hostel' with actual hostel ID from context/url
  const { data: filteredRooms = [], isLoading } = useAvailableRooms('default-hostel', filters);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ searchQuery: query });
  };

  const handleViewDetails = (roomId: string) => {
    // TODO: Open room details modal or navigate to details page
    console.log('View details for room:', roomId);
  };

  const handleRequestTransfer = (roomId: string) => {
    router.push(`/student/transfers/create?roomId=${roomId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Available Rooms for Transfer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and filter rooms available for transfer
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by room number or hostel name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <TransferFilters />
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Loading rooms...'
            : `${filteredRooms.length} room${filteredRooms.length !== 1 ? 's' : ''} available`}
        </p>
        {Object.values(filters).filter((v) => v && (typeof v !== 'boolean' || v === true)).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({
                priceRange: undefined,
                roomTypes: undefined,
                floors: undefined,
                quietFloorOnly: false,
                roommatePreference: 'any',
                searchQuery: '',
              });
              setSearchQuery('');
            }}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <TransferSkeleton type="card" count={6} />
      ) : filteredRooms.length === 0 ? (
        <NoResultsState
          searchQuery={searchQuery}
          onClearSearch={() => {
            setSearchQuery('');
            setFilters({ searchQuery: '' });
          }}
          onClearFilters={() => {
            setFilters({
              priceRange: undefined,
              roomTypes: undefined,
              floors: undefined,
              quietFloorOnly: false,
              roommatePreference: 'any',
              searchQuery: '',
            });
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredRooms.map((room, index) => (
            <div
              key={room.id}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              <RoomTransferCard
                room={room}
                onViewDetails={() => handleViewDetails(room.id)}
                onRequestTransfer={() => handleRequestTransfer(room.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
