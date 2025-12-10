'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showLabel?: boolean;
}

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

export default function RatingStars({ 
  rating, 
  onRate, 
  size = 'md',
  interactive = false,
  showLabel = false 
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const displayRating = hoverRating || rating;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };
  
  const handleClick = (value: number) => {
    if (!onRate || !interactive) return;
    setIsAnimating(true);
    onRate(value);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= displayRating;
          const isHovered = star <= hoverRating;
          
          return (
            <motion.button
              key={star}
              type="button"
              whileHover={interactive ? { scale: 1.2 } : {}}
              whileTap={interactive ? { scale: 0.9 } : {}}
              animate={isAnimating && star === rating ? {
                scale: [1, 1.3, 1],
                rotate: [0, -15, 15, 0],
              } : {}}
              onClick={() => handleClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              disabled={!interactive}
              className={cn(
                'transition-all duration-200',
                interactive ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-all duration-200',
                  isActive
                    ? isHovered
                      ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'text-amber-400 fill-amber-400'
                    : 'text-gray-300',
                  interactive && 'hover:text-amber-400'
                )}
              />
            </motion.button>
          );
        })}
      </div>
      
      {showLabel && interactive && hoverRating > 0 && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-gray-700"
        >
          {ratingLabels[hoverRating]}
        </motion.p>
      )}
    </div>
  );
}
