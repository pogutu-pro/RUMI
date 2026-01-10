import { formatDistanceToNow } from 'date-fns';
import { ActivityEvent } from '@/features/student';
import { cn } from '@/lib/utils';
import { Bell, CreditCard, FileText, Home, Info, MessageSquare, Settings, User } from 'lucide-react';

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

const getActivityColor = (type: string) => {
  // Using theme variables for consistent light/dark mode support
  switch (type) {
    case 'payment':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'booking':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'ticket':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'message':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'profile':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export function RecentActivity({ activities, className }: RecentActivityProps) {
  if (!activities?.length) {
    return (
      <div className={cn("rounded-xl border bg-card p-6 shadow-sm", className)}>
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Bell className="h-8 w-8 mb-2 opacity-20" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-sm", className)}>
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <div key={activity.id || index} className="relative flex gap-4">
            {index !== activities.length - 1 && (
              <div className="absolute left-[19px] top-8 h-full w-px bg-border" />
            )}
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                getActivityColor(activity.type)
              )}
            >
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex flex-col gap-1 pt-1 min-w-0 flex-1">
              <p className="text-sm font-bold leading-none text-foreground truncate">{activity.title}</p>
              <p className="text-xs font-medium text-foreground/90 line-clamp-2">
                {activity.description}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
