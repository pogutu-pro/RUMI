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
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-600 text-white',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      label: 'Paid Up',
    },
    due_soon: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-600 text-white',
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      label: 'Due Soon',
    },
    overdue: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-600 text-white',
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400',
      label: 'Overdue',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={cn(config.bg, config.border, className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.iconColor)} />
          <span className="dark:text-gray-100">Rent Status</span>
        </CardTitle>
        <Badge className={cn('text-[11px] font-medium', config.badge)}>
          {config.label}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {status === 'paid' ? (
          <div className="text-sm text-foreground/80">
            <p className="font-medium">You're all set!</p>
            <p className="text-xs">
              Next payment due: {nextPaymentDate ? new Date(nextPaymentDate).toLocaleDateString() : 'Not scheduled'}
            </p>
          </div>
        ) : (
          <>
            {totalOutstanding > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Amount Due</p>
                <p className="text-2xl font-bold text-foreground">
                  KES {totalOutstanding.toLocaleString()}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground/80">
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
