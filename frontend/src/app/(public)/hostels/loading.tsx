import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto py-12 space-y-8">
      <Skeleton className="h-10 w-96" /> {/* Header */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" /> {/* Search */}
        <Skeleton className="h-10 w-32" /> {/* Filters */}
        <Skeleton className="h-10 w-32" /> {/* Sort */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
