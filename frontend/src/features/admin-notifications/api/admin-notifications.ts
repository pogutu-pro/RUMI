import { axiosInstance as axios } from '@/lib/api/client';
import type { AdminEmailTemplate, AdminNotificationStats, AdminSMSTemplate } from '../types';

export const adminNotificationsApi = {
  listEmailTemplates: async (): Promise<{ total_templates: number; templates: AdminEmailTemplate[] }> => {
    const res = await axios.get('/notifications/admin/templates/email/');
    return res.data;
  },
  listSmsTemplates: async (): Promise<{ total_templates: number; templates: AdminSMSTemplate[] }> => {
    const res = await axios.get('/notifications/admin/templates/sms/');
    return res.data;
  },
  getStats: async (): Promise<AdminNotificationStats> => {
    const res = await axios.get<AdminNotificationStats>('/notifications/admin/stats/');
    return res.data;
  },
};
