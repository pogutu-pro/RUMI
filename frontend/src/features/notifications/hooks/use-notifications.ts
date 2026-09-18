'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationsApi } from '../api/notifications';
import type { NotificationListParams, NotificationPreferences } from '../types';

function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { message?: string };
  return anyErr?.message || fallback;
}

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: ['notifications', 'list', params],
    queryFn: () => notificationsApi.list(params),
    // Notifications are how a tenant sees "your reminder was sent" / "we got
    // your payment" — refetch on an interval so the bell count stays current
    // without the user needing to manually refresh.
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => notificationsApi.markRead(notificationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: notificationsApi.getPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NotificationPreferences>) => notificationsApi.updatePreferences(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
      toast.success('Preferences updated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update preferences')),
  });
}
