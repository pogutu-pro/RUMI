"use client";

import * as React from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Inbox,
  AlertCircle,
  Info,
  CreditCard,
  User,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useDeleteNotification,
} from '@/features/notifications';

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const markAsRead = useMarkNotificationAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="h-5 w-5 text-success" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-info" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'user':
        return <User className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Bell className="h-8 w-8 text-success" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated with important alerts and activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm min-h-[400px]">
        <ScrollArea className="h-[600px] pr-4">
          <CardContent className="p-6 space-y-4">
            {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg bg-card/50">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
               ))
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Inbox className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-primary">
                  All caught up!
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                  You have no new notifications at the moment.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={cn(
                      "group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                      !notification.isRead
                        ? "bg-card border-success/20 shadow-sm"
                        : "bg-muted/30 border-transparent hover:bg-card hover:border-border"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "p-2.5 rounded-full shrink-0",
                        !notification.isRead 
                          ? "bg-success/10" 
                          : "bg-muted"
                      )}>
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className={cn(
                            "text-base font-medium leading-none mb-1.5",
                            !notification.isRead ? "text-primary" : "text-muted-foreground"
                          )}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm leading-relaxed",
                          !notification.isRead ? "text-muted-foreground" : "text-muted-foreground"
                        )}>
                          {notification.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                         {!notification.isRead && (
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-success hover:bg-success/10"
                                    onClick={() => markAsRead.mutate(notification.id)}
                                >
                                    <Check className="h-4 w-4" />
                                    <span className="sr-only">Mark as read</span>
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>Mark as read</TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                         )}
                         <TooltipProvider>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteNotification.mutate(notification.id)}
                                >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    {!notification.isRead && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-success rounded-r-full" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
