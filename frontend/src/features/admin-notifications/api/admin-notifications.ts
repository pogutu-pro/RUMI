import { axiosInstance as axios } from '@/lib/api/client';
import type { AdminDelivery, AdminEmailTemplate, AdminNotificationStats, AdminSMSTemplate } from '../types';

export const adminNotificationsApi = {
  listEmailTemplates: async (): Promise<{ total_templates: number; templates: AdminEmailTemplate[] }> => {
    const res = await axios.get('/notifications/admin/templates/email/');
    return res.data;
  },
  listSmsTemplates: async (): Promise<{ total_templates: number; templates: AdminSMSTemplate[] }> => {
    const res = await axios.get('/notifications/admin/templates/sms/');
    return res.data;
  },
  listDeliveries: async (params?: {
    channel?: 'email' | 'sms';
    status?: 'sent' | 'failed';
    page?: number;
  }): Promise<{ count: number; results: AdminDelivery[] }> => {
    const res = await axios.get<{ count: number; results: AdminDelivery[] }>('/notifications/admin/deliveries/', {
      params,
    });
    return { count: res.data.count, results: res.data.results };
  },
  getStats: async (): Promise<AdminNotificationStats> => {
    const res = await axios.get<AdminNotificationStats>('/notifications/admin/stats/');
    return res.data;
  },
};
