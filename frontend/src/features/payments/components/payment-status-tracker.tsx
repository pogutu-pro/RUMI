'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMpesaPaymentStatus } from '../api/payments';
import { Circle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentStatusTrackerProps {
  transactionRef: string;
  checkoutRequestId?: string;
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
  checkoutRequestId 
}: PaymentStatusTrackerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-status', transactionRef],
    queryFn: () => getMpesaPaymentStatus({ 
      transaction_id: transactionRef,
      checkout_request_id: checkoutRequestId 
    }),
    refetchInterval: (query) => {
      // Stop polling if payment succeeded or failed
      const status = query.state.data?.status;
      return (status === 'success' || status === 'failed') ? false : 5000;
    },
    enabled: !!transactionRef,
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Build timeline from transaction data
  const timeline: TimelineEvent[] = React.useMemo(() => {
    if (!data) return [];

    const events: TimelineEvent[] = [];
    
    // Always add initial pending state
    events.push({
      status: 'pending',
      timestamp: data.transaction?.date || new Date().toISOString(),
    });

    // Add current status if different from pending
    if (data.status !== 'pending') {
      events.push({
        status: data.status as any,
        timestamp: data.last_updated,
      });
    }

    return events;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((event, index) => {
        const config = STATUS_CONFIG[event.status];
        const Icon = config.icon;
        const isLast = index === timeline.length - 1;

        return (
          <div key={index} className="flex gap-3">
            {/* Status Dot/Icon */}
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

            {/* Status Label */}
            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold">
                {config.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(event.timestamp)}
              </p>
              {event.status === 'failed' && data?.transaction.id && (
                <p className="text-xs text-red-600 mt-1">
                  Transaction failed. Please try again or contact support.
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Show M-Pesa receipt if available */}
      {data?.transaction && data.status === 'success' && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">M-Pesa Receipt</p>
          <p className="text-sm font-mono font-semibold">{data.transaction.reference}</p>
        </div>
      )}
    </div>
  );
}
