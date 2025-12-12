'use client';

import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Review } from '@/types/entities.types';
import { useMemo } from 'react';

interface RatingBreakdownProps {
  reviews: Review[];
  className?: string;
  showEmptyStars?: boolean; // Show 0-count rows (better for loading states)
}

export default function RatingBreakdown({
  reviews,
  className,
  showEmptyStars = false,
}: RatingBreakdownProps) {
  const breakdown = useMemo(() => {
    const total = reviews.length;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        counts[review.rating as keyof typeof counts]++;
      }
    });

    return [5, 4, 3, 2, 1].map((star) => {
      const count = counts[star as keyof typeof counts];
      const percentage = total > 0 ? (count / total) * 100 : 0;

      return {
        star,
        count,
        percentage,
        label: `${star} star${star !== 1 ? 's' : ''}`,
      };
    });
  }, [reviews, showEmptyStars]);

  if (reviews.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No reviews yet
      </div>
    );
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      {breakdown.map(({ star, count, percentage, label }) => (
        <div key={star} className="flex items-center gap-3">
          {/* Star label */}
          <div className="flex items-center gap-1.5 w-16 text-sm font-medium text-gray-700">
            <span>{star}</span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>

          {/* Progress bar */}
          <div className="flex-1">
            <Progress
              value={percentage}
              className="h-2.5 bg-gray-100"
              indicatorClassName={cn(
                'transition-all duration-500',
                percentage > 70
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                  : percentage > 40
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                    : percentage > 20
                      ? 'bg-gradient-to-r from-orange-400 to-red-400'
                      : 'bg-gradient-to-r from-red-400 to-red-500',
              )}
            />
          </div>

          {/* Count */}
          <span className="w-10 text-right text-sm font-medium text-gray-600">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}
