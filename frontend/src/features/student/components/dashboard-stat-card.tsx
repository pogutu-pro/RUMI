'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: 'default' | 'emerald' | 'amber' | 'blue';
  className?: string;
}

export function DashboardStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: DashboardStatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    emerald: 'bg-primary/10 border-primary/20',
    amber: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
    blue: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs font-medium flex items-center gap-1', trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground font-normal">{trend.label}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
