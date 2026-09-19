'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/use-notifications';
import type { AppNotification } from '../types';

function NotificationRow({
  notification,
  onRead,
  onOpen,
}: {
  notification: AppNotification;
  onRead: (id: number) => void;
  onOpen: (url: string) => void;
}) {
  const isUnread = !notification.read_at;
  const url = typeof notification.metadata?.url === 'string' ? notification.metadata.url : '';
  return (
    <DropdownMenuItem
      onClick={() => {
        if (isUnread) onRead(notification.notification_id);
        if (url) onOpen(url);
      }}
      className={cn('flex flex-col items-start gap-0.5 whitespace-normal py-2.5', isUnread && 'bg-primary/5')}
    >
      <div className="flex w-full items-center gap-2">
        {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
        <span className="truncate text-sm font-medium text-foreground">{notification.subject}</span>
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
      <p className="text-[11px] text-muted-foreground">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
      </p>
    </DropdownMenuItem>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const { data } = useNotifications({ limit: 20 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = data?.unread_count ?? 0;
  const notifications = data?.notifications ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <NotificationRow
                key={n.notification_id}
                notification={n}
                onRead={(id) => markRead.mutate(id)}
                onOpen={(url) => router.push(url)}
              />
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
