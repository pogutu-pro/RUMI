'use client';

import { Suspense, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getHostelBySlug, hostelsApi } from '@/features/hostels';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { Hostel, Room } from '@/types/entities.types';

// New specialized variants
import PublicHostelDetail from './public-hostel-detail';
import DashboardHostelDetail from './dashboard-hostel-detail';

interface HostelDetailClientProps {
  slug: string;
}

export function HostelDetailClient({ slug }: HostelDetailClientProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Fetch the hostel
  const {
    data: rawHostel,
    isLoading: isLoadingHostel,
    error: hostelError,
  } = useQuery<Hostel>({
    queryKey: ['hostel', slug],
    queryFn: () => getHostelBySlug(slug),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch rooms for this hostel if not included in hostel response
  const {
    data: roomsResponse,
    isLoading: isLoadingRooms,
  } = useQuery({
    queryKey: ['hostel-rooms', rawHostel?.id],
    queryFn: () => hostelsApi.getRooms({ hostel: rawHostel?.id }),
    enabled: Boolean(rawHostel?.id) && (!rawHostel?.rooms || rawHostel.rooms.length === 0),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingHostel || isLoadingRooms;

  // Combine hostel with rooms data
  const hostel = useMemo(() => {
    if (!rawHostel) return null;
    
    // Use rooms from hostel response if available, otherwise use separately fetched rooms
    const rooms: Room[] = (rawHostel?.rooms && rawHostel.rooms.length > 0)
      ? rawHostel.rooms
      : (roomsResponse?.data || []);
    
    return {
      ...rawHostel,
      rooms,
      reviews: rawHostel?.reviews || [],
    } as Hostel;
  }, [rawHostel, roomsResponse]);

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

  if (hostelError || !hostel) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-4 text-6xl">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hostel Not Found</h1>
          <p className="text-gray-600 mb-6">
            The hostel you're looking for could not be found or has been removed.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Determine which variant to show
  // If authenticated as a student, show the personalized dashboard view
  if (isAuthenticated && user?.role === 'student') {
    return (
      <DashboardHostelDetail 
        hostel={hostel} 
        studentContext={{
          roommateMatchScore: 85, // Mock score - should come from backend
          isSaved: hostel.is_favorited || false,
          applicationStatus: 'none'
        }}
      />
    );
  }

  // Default to Public View (SEO & Marketing focused)
  return <PublicHostelDetail hostel={hostel} />;
}
