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

  const notifications = notificationsData?.results || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="h-5 w-5 text-emerald-500" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'user':
        return <User className="h-5 w-5 text-orange-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Bell className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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
      <Card className="border-none shadow-md bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm min-h-[400px]">
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
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <Inbox className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  All caught up!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
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
                      !notification.is_read
                        ? "bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900/50 shadow-sm"
                        : "bg-slate-50/50 dark:bg-slate-900/30 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-border"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "p-2.5 rounded-full shrink-0",
                        !notification.is_read 
                          ? "bg-emerald-100 dark:bg-emerald-900/30" 
                          : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className={cn(
                            "text-base font-medium leading-none mb-1.5",
                            !notification.is_read ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                          )}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm leading-relaxed",
                          !notification.is_read ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-500"
                        )}>
                          {notification.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                         {!notification.is_read && (
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                    {!notification.is_read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-r-full" />
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
