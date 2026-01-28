'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Check, 
  Trash2, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  XCircle 
} from 'lucide-react';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '@/features/notifications/hooks/use-notifications';
import { cn } from '@/lib/utils';

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4" />;
    case 'error':
      return <XCircle className="h-4 w-4" />;
    case 'info':
    default:
      return <Info className="h-4 w-4" />;
  }
};

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useNotifications();
  const notifications = notificationsData?.data || [];
  
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
         <div className="flex justify-between items-center border-b border-border/50 pb-6 pt-4">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded opacity-50" />
            </div>
         </div>
         {[1, 2, 3].map(i => (
           <div key={i} className="h-24 w-full bg-muted/20 border border-border/50 rounded-xl" />
         ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-8 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Notification Center
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Administrative and operational alerts regarding your tenancy.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()} className="font-bold border-border/50 h-9">
            <Check className="h-4 w-4 mr-2" />
            Mark all as viewed
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Recent Logs</h2>
          <div className="space-y-3">
            {notifications.map((notification) => (
                <Card
                key={notification.id}
                className={cn(
                    "group relative overflow-hidden transition-all border border-border/50 shadow-sm",
                    !notification.isRead ? "bg-muted/10 border-primary/20" : "bg-card"
                )}
                >
                <CardContent className="flex items-start justify-between p-5 gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className={cn(
                            "p-2.5 rounded-lg border",
                            !notification.isRead 
                            ? "bg-background border-primary/20 text-primary" 
                            : "bg-muted/30 border-border/50 text-muted-foreground opacity-50"
                        )}>
                            {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className={cn(
                                    "text-sm font-bold tracking-tight",
                                    !notification.isRead ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {notification.title}
                                </h3>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-50 whitespace-nowrap pt-0.5">
                                    {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground leading-relaxed pr-10">
                                {notification.message}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                    {!notification.isRead && (
                        <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/5 border border-transparent hover:border-primary/10"
                        onClick={() => markAsRead(notification.id)}
                        >
                        <Check className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        onClick={() => deleteNotification(notification.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                </CardContent>
                </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-5">
                <Bell className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Registry Clear</h3>
                <p className="text-xs font-medium text-muted-foreground max-w-xs">
                    There are no operational notifications requiring your attention at this time.
                </p>
            </div>
        </div>
      )}
    </div>
  );
}
