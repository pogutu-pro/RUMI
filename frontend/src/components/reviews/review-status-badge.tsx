'use client';

import { AlertCircle, Clock, Flag, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewStatus } from '@/types/entities.types';

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  flagReason?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ReviewStatus, { 
  label: string; 
  icon: any; 
  className: string;
  description: string;
}> = {
  published: {
    label: 'Published',
    icon: null,
    className: '',
    description: '',
  },
  under_review: {
    label: 'Under Review',
    icon: Clock,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-300',
    description: 'This review is being verified by our team',
  },
  flagged: {
    label: 'Flagged',
    icon: Flag,
    className: 'bg-red-50 text-red-700 border-red-300',
    description: 'This review has been reported for review',
  },
  removed: {
    label: 'Removed',
    icon: XCircle,
    className: 'bg-gray-50 text-gray-700 border-gray-300',
    description: 'This review was removed by moderators',
  },
};

export default function ReviewStatusBadge({ 
  status, 
  flagReason,
  size = 'md' 
}: ReviewStatusBadgeProps) {
  if (status === 'published') return null;
  
  const config = statusConfig[status];
  const Icon = config.icon;
  const isSmall = size === 'sm';
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
      title={flagReason || config.description}
    >
      {Icon && <Icon className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      <span>{config.label}</span>
    </div>
  );
}

// Short Review indicator
export function ShortReviewBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const isSmall = size === 'sm';
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200',
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
      title="Short review - less than 50 characters"
    >
      <AlertCircle className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>Short Review</span>
    </div>
  );
}
