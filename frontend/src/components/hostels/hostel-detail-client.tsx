'use client';

import { Suspense, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import HostelDetails from '@/components/hostels/hostel-details';
import HostelBookingWidget from '@/components/hostels/hostel-booking-widget';
import HostelHero from '@/components/hostels/hostel-hero';
import HostelGallery from '@/components/hostels/hostel-gallery';
import RelatedHostels from '@/app/(public)/hostels/related-hostels';
import { getHostelBySlug } from '@/lib/api/hostels';
import type { Hostel } from '@/types/entities.types';

interface HostelDetailClientProps {
  slug: string;
}

// Mock rooms data for testing booking flow
const MOCK_ROOMS = [
  {
    id: 'room-001',
    name: 'Standard Single Room',
    price: 8500,
    beds: 0,
    capacity: 1,
    images: ['/images/rooms/single-1.jpg'],
    available: true,
    bookedDates: [],
  },
  {
    id: 'room-002',
    name: 'Shared Double Room',
    price: 6000,
    beds: 1,
    capacity: 2,
    images: ['/images/rooms/double-1.jpg'],
    available: true,
    bookedDates: [],
  },
  {
    id: 'room-003',
    name: 'Premium Single Room',
    price: 12000,
    beds: 0,
    capacity: 1,
    images: ['/images/rooms/premium-1.jpg'],
    available: true,
    bookedDates: [],
  },
  {
    id: 'room-004',
    name: 'Economy Triple Room',
    price: 4500,
    beds: 2,
    capacity: 3,
    images: ['/images/rooms/triple-1.jpg'],
    available: true,
    bookedDates: [],
  },
  {
    id: 'room-005',
    name: 'Executive Single (Fully Booked)',
    price: 15000,
    beds: 1,
    capacity: 1,
    images: ['/images/rooms/executive-1.jpg'],
    available: false,
    bookedDates: [],
  },
];

function LoadingRelated() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}

export default function HostelDetailClient({ slug }: HostelDetailClientProps) {
  const {
    data: rawHostel,
    isLoading,
    error,
  } = useQuery<Hostel>({
    queryKey: ['hostel', slug],
    queryFn: () => getHostelBySlug(slug),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Inject mock rooms if the hostel doesn't have rooms from the backend
  const hostel = useMemo(() => {
    if (!rawHostel) return null;
    return {
      ...rawHostel,
      rooms: rawHostel.rooms && rawHostel.rooms.length > 0 
        ? rawHostel.rooms 
        : MOCK_ROOMS,
      // Also set pricePerMonth from base_price if not set
      pricePerMonth: rawHostel.pricePerMonth || parseFloat(rawHostel.base_price) || 8000,
    };
  }, [rawHostel]);


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="space-y-8">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !hostel) {
    // Error boundary will handle this
    return null;
  }

  return (
    <div className="container mx-auto py-6 md:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* 1. Hero & Gallery (Full Width) */}
      <div className="space-y-4 mb-8 md:mb-10">
        <HostelHero hostel={hostel} />
        {hostel.images && hostel.images.length > 0 && (
          <HostelGallery images={hostel.images} hostelName={hostel.name} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative">
        {/* 2. Main Content (Left Column) */}
        <div className="lg:col-span-2">
          <HostelDetails hostel={hostel} />
          
          {/* Related Hostels Section */}
          <section className="py-10 border-t border-gray-200 mt-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              More places to stay nearby
            </h2>
            <Suspense fallback={<LoadingRelated />}>
              <RelatedHostels slug={slug} />
            </Suspense>
          </section>
        </div>

        {/* 3. Sticky Booking Widget (Right Column) */}
        <div className="relative hidden lg:block">
          <div className="sticky top-20 w-full">
             <HostelBookingWidget hostel={hostel} />
          </div>
        </div>
      </div>
      
      {/* Mobile Booking Widget (Fixed Bottom) - handled inside HostelBookingWidget */}
      <div className="lg:hidden">
        <HostelBookingWidget hostel={hostel} />
      </div>
    </div>
  );
}
