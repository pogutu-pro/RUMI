// src/app/(public)/hostels/[slug]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto py-12 space-y-12">
      <Skeleton className="h-12 w-3/4" /> {/* Hero title */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Skeleton className="col-span-2 row-span-2 h-96" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" /> {/* Map */}
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white" />{' '}
      {/* Mobile widget placeholder */}
    </div>
  );
}
