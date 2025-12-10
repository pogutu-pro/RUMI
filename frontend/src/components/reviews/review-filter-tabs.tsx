'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Star, CheckCircle, TrendingUp } from 'lucide-react';
import type { ReviewFilters } from '@/types/entities.types';

interface ReviewFilterTabsProps {
  activeFilter: ReviewFilters['sort'];
  onFilterChange: (filter: ReviewFilters['sort']) => void;
  verifiedOnly: boolean;
  onVerifiedToggle: () => void;
}

const filters: Array<{ 
  value: ReviewFilters['sort']; 
  label: string; 
  icon: any;
}> = [
  { value: 'helpful', label: 'Most Helpful', icon: TrendingUp },
  { value: 'newest', label: 'Newest', icon: Star },
  { value: 'highest', label: 'Highest Rated', icon: Star },
  { value: 'lowest', label: 'Lowest Rated', icon: Star },
];

export default function ReviewFilterTabs({ 
  activeFilter, 
  onFilterChange,
  verifiedOnly,
  onVerifiedToggle 
}: ReviewFilterTabsProps) {
  return (
    <div className="sticky top-16 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 -mx-6 px-6 py-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Instagram-style horizontal scroll tabs */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.value;
            const Icon = filter.icon;
            
            return (
              <button
                key={filter.value}
                onClick={() => onFilterChange(filter.value)}
                className="relative flex-shrink-0"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200',
                    'border whitespace-nowrap',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{filter.label}</span>
                </motion.div>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-3 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Verified Toggle */}
        <button
          onClick={onVerifiedToggle}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border',
            verifiedOnly
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Verified Only</span>
        </button>
      </div>
    </div>
  );
}
