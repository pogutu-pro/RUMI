import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function DashboardStat({ title, value, icon, trend, className }: DashboardStatProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="mt-1 flex items-center text-xs">
            {trend.direction === 'up' && <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />}
            {trend.direction === 'down' && <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />}
            {trend.direction === 'neutral' && <MinusIcon className="mr-1 h-3 w-3 text-muted-foreground" />}
            <span
              className={cn(
                "font-medium",
                trend.direction === 'up' && "text-green-500",
                trend.direction === 'down' && "text-red-500",
                trend.direction === 'neutral' && "text-muted-foreground"
              )}
            >
              {Math.abs(trend.value)}%
            </span>
            <span className="ml-1 text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
