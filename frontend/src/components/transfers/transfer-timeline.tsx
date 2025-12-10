import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

interface TransferTimelineProps {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  createdAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
  className?: string;
}

interface TimelineStep {
  label: string;
  status: 'complete' | 'current' | 'pending';
  date?: Date;
  description?: string;
}

export function TransferTimeline({
  status,
  createdAt,
  respondedAt,
  completedAt,
  className,
}: TransferTimelineProps) {
  const getSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        label: 'Request Submitted',
        status: 'complete',
        date: createdAt,
        description: 'Your transfer request has been submitted',
      },
    ];

    if (status === 'pending') {
      steps.push({
        label: 'Under Review',
        status: 'current',
        description: 'Awaiting admin approval',
      });
      steps.push({
        label: 'Decision',
        status: 'pending',
        description: 'Transfer approval or rejection',
      });
    } else if (status === 'approved') {
      steps.push({
        label: 'Approved',
        status: 'complete',
        date: respondedAt,
        description: 'Your request has been approved',
      });
      steps.push({
        label: 'Pending Transfer',
        status: 'current',
        description: 'Awaiting room transfer completion',
      });
    } else if (status === 'completed') {
      steps.push({
        label: 'Approved',
        status: 'complete',
        date: respondedAt,
        description: 'Request approved',
      });
      steps.push({
        label: 'Completed',
        status: 'complete',
        date: completedAt,
        description: 'Room transfer completed successfully',
      });
    } else if (status === 'rejected') {
      steps.push({
        label: 'Rejected',
        status: 'complete',
        date: respondedAt,
        description: 'Request was not approved',
      });
    } else if (status === 'cancelled') {
      steps.push({
        label: 'Cancelled',
        status: 'complete',
        date: respondedAt,
        description: 'Request was cancelled',
      });
    }

    return steps;
  };

  const steps = getSteps();

  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                step.status === 'complete'
                  ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                  : step.status === 'current'
                  ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
              )}
            >
              {step.status === 'complete' ? (
                <Check className="h-4 w-4" />
              ) : step.status === 'current' ? (
                <Circle className="h-3 w-3 fill-current animate-pulse" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-12 w-0.5 my-1',
                  step.status === 'complete'
                    ? 'bg-emerald-600 dark:bg-emerald-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <p
              className={cn(
                'font-semibold',
                step.status === 'complete'
                  ? 'text-foreground'
                  : step.status === 'current'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground'
              )}
            >
              {step.label}
            </p>
            {step.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {step.description}
              </p>
            )}
            {step.date && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(step.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
