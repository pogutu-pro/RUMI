'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '@/features/notifications/hooks/use-notifications';

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useNotifications();
  const notifications = notificationsData?.data || [];
  
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
         <div className="flex justify-between">
           <div className="h-8 w-48 bg-muted animate-pulse rounded" />
           <div className="h-8 w-32 bg-muted animate-pulse rounded" />
         </div>
         {[1, 2, 3].map(i => (
           <div key={i} className="h-24 w-full bg-muted/50 animate-pulse rounded-xl" />
         ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with your hostel activities
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllAsRead()}>
            <Check className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`group flex items-start justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                !notification.isRead
                  ? 'bg-primary/5 border-l-4 border-l-primary border-y-primary/10 border-r-primary/10' 
                  : 'bg-card border-border hover:border-primary/20'
              }`}
            >
              <CardContent className="flex items-start justify-between py-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-2 rounded-full ${
                    notification.isRead 
                      ? 'bg-muted text-muted-foreground' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-none ${
                        !notification.isRead ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/30 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
