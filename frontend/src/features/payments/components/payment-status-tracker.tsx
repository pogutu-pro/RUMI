'use client';

import * as React from 'react';
import { Circle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentStatusTrackerProps {
  transactionRef: string;
  status?: 'pending' | 'processing' | 'success' | 'failed';
  lastUpdated?: string;
}

interface TimelineEvent {
  status: 'pending' | 'processing' | 'success' | 'failed';
  timestamp: string;
  message?: string;
}

const STATUS_CONFIG = {
  pending: {
    color: 'gray',
    bgColor: 'bg-gray-600',
    icon: Circle,
    label: 'Waiting for payment'
  },
  processing: {
    color: 'blue',
    bgColor: 'bg-blue-600',
    icon: Loader2,
    label: 'Payment received, reconciling...'
  },
  success: {
    color: 'green',
    bgColor: 'bg-green-600',
    icon: CheckCircle2,
    label: 'Payment confirmed'
  },
  failed: {
    color: 'red',
    bgColor: 'bg-red-600',
    icon: XCircle,
    label: 'Payment failed'
  }
} as const;

export function PaymentStatusTracker({
  transactionRef,
  status = 'pending',
  lastUpdated,
}: PaymentStatusTrackerProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const timeline: TimelineEvent[] = React.useMemo(() => {
    const events: TimelineEvent[] = [];

    events.push({
      status: 'pending',
      timestamp: new Date().toISOString(),
    });

    if (status !== 'pending') {
      events.push({
        status,
        timestamp: lastUpdated || new Date().toISOString(),
      });
    }

    return events;
  }, [status, lastUpdated]);

  return (
    <div className="space-y-4">
      {timeline.map((event, index) => {
        const config = STATUS_CONFIG[event.status];
        const Icon = config.icon;
        const isLast = index === timeline.length - 1;

        return (
          <div key={index} className="flex gap-3">
            <div className="relative">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                config.bgColor
              )}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              {!isLast && (
                <div className="absolute left-4 top-10 w-px h-8 bg-border" />
              )}
            </div>

            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold">
                {config.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(event.timestamp)}
              </p>
              {event.status === 'failed' && (
                <p className="text-xs text-red-600 mt-1">
                  Transaction failed. Please try again or contact support.
                </p>
              )}
            </div>
          </div>
        );
      })}

      {status === 'success' && transactionRef && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">Transaction Reference</p>
          <p className="text-sm font-mono font-semibold">{transactionRef}</p>
        </div>
      )}
    </div>
  );
}
