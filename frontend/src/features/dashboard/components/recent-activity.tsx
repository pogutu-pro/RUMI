'use client';

import { formatDistanceToNow } from 'date-fns';
import { ActivityEvent } from '@/features/student';
import { cn } from '@/lib/utils';
import { Bell, CreditCard, FileText, Home, Info, MessageSquare, Settings, User, CheckCircle2 } from 'lucide-react';

interface RecentActivityProps {
  activities: ActivityEvent[];
  className?: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'payment':
      return <CreditCard className="h-4 w-4" />;
    case 'booking':
      return <Home className="h-4 w-4" />;
    case 'ticket':
      return <FileText className="h-4 w-4" />;
    case 'message':
      return <MessageSquare className="h-4 w-4" />;
    case 'profile':
      return <User className="h-4 w-4" />;
    case 'system':
      return <Settings className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

// Premium color palette for activity types
const getActivityStyles = (type: string) => {
  switch (type) {
    case 'payment':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'booking':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'ticket':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    case 'message':
      return 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400';
    case 'profile':
      return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground';
  }
};

export function RecentActivity({ activities, className }: RecentActivityProps) {
  if (!activities?.length) {
    return (
      <div className={cn("rounded-3xl border border-dashed p-8 text-center", className)}>
        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <h3 className="font-semibold text-foreground">No recent updates</h3>
        <p className="text-sm text-muted-foreground mt-1">When something happens, you'll see it here.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-bold tracking-tight">Timeline</h3>
         {/* Optional filter or view all button could go here */}
      </div>

      <div className="relative space-y-8 pl-2">
        {/* Continuous Line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-border via-border/50 to-transparent" />

        {activities.map((activity, index) => (
          <div key={activity.id || index} className="relative flex gap-6 group">
            {/* Timeline Node */}
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-4 ring-background transition-transform group-hover:scale-110 duration-300",
                getActivityStyles(activity.type)
              )}
            >
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5 pt-1.5 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                 <p className="text-sm font-bold text-foreground leading-none group-hover:text-primary transition-colors">
                    {activity.title}
                 </p>
                 <span className="text-[10px] font-medium text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                 </span>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
