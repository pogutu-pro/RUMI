import * as React from 'react';
import { cn } from '@/lib/utils';

interface TransferSkeletonProps {
  type?: 'card' | 'list' | 'detail';
  count?: number;
  className?: string;
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 animate-pulse">
      <div className="space-y-4">
        {/* Image skeleton */}
        <div className="h-48 bg-muted rounded-lg" />
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="h-6 bg-muted rounded w-20" />
          </div>
          <div className="h-8 bg-muted rounded w-40" />
          <div className="flex gap-2">
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        </div>

        {/* Buttons skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="h-10 bg-muted rounded flex-1" />
          <div className="h-10 bg-muted rounded flex-1" />
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Timeline skeleton */}
        <div className="lg:w-1/3 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Details skeleton */}
        <div className="lg:w-2/3 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-48" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
            <div className="h-8 bg-muted rounded w-28" />
          </div>
          <div className="h-24 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-10 bg-muted rounded w-32" />
            <div className="h-10 bg-muted rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-muted rounded-lg" />
      <div className="h-64 bg-muted rounded-lg" />
      <div className="h-48 bg-muted rounded-lg" />
    </div>
  );
}

export function TransferSkeleton({ type = 'card', count = 1, className }: TransferSkeletonProps) {
  const SkeletonComponent = {
    card: CardSkeleton,
    list: ListSkeleton,
    detail: DetailSkeleton,
  }[type];

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
