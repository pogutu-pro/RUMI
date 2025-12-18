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
    <div className={cn("rounded-xl border bg-transparent p-4 md:p-6 shadow-none transition-all hover:bg-muted/30", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs md:text-sm font-bold text-foreground truncate mr-2">{title}</h3>
        <div className="rounded-full bg-primary/10 p-1.5 md:p-2 text-primary shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-3 md:mt-4">
        <div className="text-xl md:text-2xl font-black text-foreground truncate">{value}</div>
        {trend && (
          <div className="mt-1 flex items-center text-xs font-medium">
            {trend.direction === 'up' && <ArrowUpIcon className="mr-1 h-3 w-3 text-emerald-600 dark:text-emerald-500" />}
            {trend.direction === 'down' && <ArrowDownIcon className="mr-1 h-3 w-3 text-red-600 dark:text-red-500" />}
            {trend.direction === 'neutral' && <MinusIcon className="mr-1 h-3 w-3 text-muted-foreground" />}
            <span
              className={cn(
                "font-bold",
                trend.direction === 'up' && "text-emerald-600 dark:text-emerald-500",
                trend.direction === 'down' && "text-red-600 dark:text-red-500",
                trend.direction === 'neutral' && "text-muted-foreground"
              )}
            >
              {Math.abs(trend.value)}%
            </span>
            <span className="ml-1 text-muted-foreground/80 truncate hidden sm:inline">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
