'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import type { ActivityEvent } from '@/types/entities.types';
import {
  FileText,
  CreditCard,
  MessageSquare,
  Users,
  LifeBuoy,
  CalendarCheck,
  Bell,
} from 'lucide-react';

interface ActivityFeedProps {
  events: ActivityEvent[];
  limit?: number;
  className?: string;
}

export function ActivityFeed({ events, limit = 5, className }: ActivityFeedProps) {
  const displayEvents = events.slice(0, limit);

  const getIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'invoice':
        return FileText;
      case 'payment':
        return CreditCard;
      case 'message':
        return MessageSquare;
      case 'roommate':
        return Users;
      case 'ticket':
        return LifeBuoy;
      case 'booking':
        return CalendarCheck;
      case 'announcement':
        return Bell;
      default:
        return Bell;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {displayEvents.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground text-center">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {displayEvents.map((event) => {
              const Icon = getIcon(event.type);
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground/80 mt-1">{getTimeAgo(event.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
