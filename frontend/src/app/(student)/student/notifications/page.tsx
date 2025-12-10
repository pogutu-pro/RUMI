'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Filter } from 'lucide-react';

export default function NotificationsPage() {
  // TODO: Fetch from API
  const [notifications, setNotifications] = React.useState([
    {
      id: '1',
      type: 'payment',
      title: 'Payment Received',
      message: 'Your rent payment of KES 15,000 has been confirmed.',
      timestamp: '2024-01-28T10:30:00',
      read: false,
    },
    {
      id: '2',
      type: 'support',
      title: 'Ticket Updated',
      message: 'Your support ticket #1234 has been resolved.',
      timestamp: '2024-01-27T15:45:00',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
          <Button variant="outline" onClick={markAllAsRead}>
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
              className={`bg-card ${!notification.read ? 'border-l-4 border-l-primary' : ''}`}
            >
              <CardContent className="flex items-start justify-between py-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.read ? 'bg-muted' : 'bg-primary/10'}`}
                  >
                    <Bell
                      className={`h-5 w-5 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p
                        className={`font-semibold ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(notification.timestamp).toLocaleTimeString(
                          'en-US',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="hover:bg-accent"
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-accent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-dashed">
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
