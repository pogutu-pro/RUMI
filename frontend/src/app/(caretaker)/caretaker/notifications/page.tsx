'use client';

import * as React from 'react';
import { Bell, Clock, CheckCircle, AlertCircle, Info, Trash2, Check } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/features/notifications';
import type { Notification } from '@/types/auth.types';

// Helper for relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useNotifications(); // Fetch all notifications
  const notifications = notificationsData?.data || [];             // Extract array from PaginatedResponse
  
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const [filter, setFilter] = React.useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter((n: Notification) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/10 border-l-amber-500';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/10 border-l-green-500';
      default:
        return 'bg-blue-50 dark:bg-blue-900/10 border-l-blue-500';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Stay updated with all hostel activities and alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {notifications.length - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : 'No notifications to display'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                'border-l-4 transition-all',
                !notification.is_read && 'bg-muted/30',
                getTypeBgColor(notification.type)
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getTypeIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(notification.created_at)}
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={markAsReadMutation.isPending}
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
