/**
 * Skeleton screen components for loading states
 * Optimized for mobile-first with shimmer animations
 */

import { cn } from '@/lib/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base skeleton component with shimmer effect
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200/80 relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:translate-x-[-100%] before:animate-[shimmer_2s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton for hostel card listing
 */
export function HostelCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
      {/* Image skeleton */}
      <Skeleton className="h-48 sm:h-56 w-full rounded-none" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Location */}
        <Skeleton className="h-4 w-1/2" />
        
        {/* Features */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        {/* Price & Rating */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for search result list
 */
export function SearchResultSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b border-gray-100">
      <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton for profile header
 */
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-6">
      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

/**
 * Skeleton for dashboard stats
 */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-lg border border-gray-200 space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Grid of hostel card skeletons
 */
export function HostelGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <HostelCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      {/* Content */}
      <HostelGridSkeleton count={9} />
    </div>
  );
}
