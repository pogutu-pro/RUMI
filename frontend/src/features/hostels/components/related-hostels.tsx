'use client';

import { useQuery } from '@tanstack/react-query';
import { HostelGrid } from '@/features/hostels';
import { Skeleton } from '@/components/ui/skeleton';
import { getRelatedHostels } from '@/features/hostels';
import type { Hostel } from '@/types/entities.types';

interface RelatedHostelsProps {
  slug: string;
}

export default function RelatedHostels({ slug }: RelatedHostelsProps) {
  const {
    data: related = [],
    isLoading,
    error,
  } = useQuery<Hostel[]>({
    queryKey: ['relatedHostels', slug],
    queryFn: () => getRelatedHostels(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || related.length === 0) {
    return null;
  }

  return <HostelGrid hostels={related} />;
}
