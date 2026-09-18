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
