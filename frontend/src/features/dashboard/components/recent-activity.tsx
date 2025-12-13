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
  switch (type) {
    case 'payment':
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    case 'booking':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'ticket':
      return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    case 'message':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    case 'profile':
      return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
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
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-sm font-medium leading-none">{activity.title}</p>
              <p className="text-xs text-muted-foreground">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
