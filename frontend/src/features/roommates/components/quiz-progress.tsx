'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface QuizProgressProps {
  current: number;
  total: number;
  percentage: number;
  isComplete?: boolean;
  className?: string;
}

export function QuizProgress({
  current,
  total,
  percentage,
  isComplete = false,
  className,
}: QuizProgressProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Question Counter */}
      <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-70">
        <span>
          Question {current} / {total}
        </span>
        <span className={cn(isComplete ? 'text-primary' : 'text-foreground')}>
          {percentage}% Complete
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden border border-border/20">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            isComplete ? 'bg-primary' : 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="text-center py-2 animate-in fade-in slide-in-from-top-2">
          <p className="text-primary font-bold text-base">
            Assessment Completed
          </p>
        </div>
      )}

      {/* Status Message */}
      {!isComplete && (
        <div className="text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
            {getStatusMessage(current, total)}
          </p>
        </div>
      )}
    </div>
  );
}

function getStatusMessage(current: number, total: number): string {
  const progress = current / total;
  
  if (current === 1) {
    return "Beginning Assessment";
  } else if (progress < 0.5) {
    return 'Processing Inputs...';
  } else if (progress < 1) {
    return 'Analysis in Progress';
  }
  return '';
}
