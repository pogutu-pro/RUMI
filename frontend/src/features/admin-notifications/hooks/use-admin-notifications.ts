'use client';

import { useQuery } from '@tanstack/react-query';
import { adminNotificationsApi } from '../api/admin-notifications';

export function useAdminEmailTemplates() {
  return useQuery({
    queryKey: ['admin-notifications', 'email-templates'],
    queryFn: adminNotificationsApi.listEmailTemplates,
  });
}

export function useAdminSmsTemplates() {
  return useQuery({
    queryKey: ['admin-notifications', 'sms-templates'],
    queryFn: adminNotificationsApi.listSmsTemplates,
  });
}

export function useAdminNotificationStats() {
  return useQuery({
    queryKey: ['admin-notifications', 'stats'],
    queryFn: adminNotificationsApi.getStats,
  });
}

// Deliveries arrive continuously (every code, reset and reminder); keep the
// log fresh instead of showing whatever was cached five minutes ago.
export function useAdminDeliveries(params?: { channel?: 'email' | 'sms'; status?: 'sent' | 'failed'; page?: number }) {
  return useQuery({
    queryKey: ['admin-notifications', 'deliveries', params ?? {}],
    queryFn: () => adminNotificationsApi.listDeliveries(params),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    placeholderData: (previous) => previous,
  });
}
