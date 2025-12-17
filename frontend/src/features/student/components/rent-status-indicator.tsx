'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type { RentStatusInfo } from '@/types/entities.types';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RentStatusIndicatorProps {
  rentStatus: RentStatusInfo;
  className?: string;
}

export function RentStatusIndicator({ rentStatus, className }: RentStatusIndicatorProps) {
  const { status, daysUntilDue, totalOutstanding, nextPaymentDate } = rentStatus;

  const statusConfig = {
    paid: {
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-600 text-white hover:bg-emerald-700',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      label: 'Paid Up',
    },
    due_soon: {
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-600 text-white hover:bg-amber-700',
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      label: 'Due Soon',
    },
    overdue: {
      border: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-600 text-white hover:bg-red-700',
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400',
      label: 'Overdue',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={cn("transition-colors duration-200", config.border, className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.iconColor)} />
          <span className="text-foreground">Rent Status</span>
        </CardTitle>
        <Badge className={cn('text-[11px] font-bold px-3 py-1', config.badge)}>
          {config.label}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {status === 'paid' ? (
          <div className="text-sm text-foreground">
            <p className="font-semibold text-base mb-1">You're all set!</p>
            <p className="text-xs text-muted-foreground font-medium">
              Next payment due: <span className="text-foreground">{nextPaymentDate ? new Date(nextPaymentDate).toLocaleDateString() : 'Not scheduled'}</span>
            </p>
          </div>
        ) : (
          <>
            {totalOutstanding > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount Due</p>
                <p className="text-2xl font-black text-foreground mt-1">
                  KES {totalOutstanding.toLocaleString()}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {status === 'due_soon' ? (
                  <>{daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} until payment</>
                ) : (
                  <>Payment is {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue</>
                )}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
