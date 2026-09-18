import { axiosInstance as axios } from '@/lib/api/client';
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationPreferences,
} from '../types';

export const notificationsApi = {
  list: async (params?: NotificationListParams): Promise<NotificationListResponse> => {
    const res = await axios.get<NotificationListResponse>('/notifications/', { params });
    return res.data;
  },
  markRead: async (notificationId: number): Promise<void> => {
    await axios.put(`/notifications/${notificationId}/read/`);
  },
  markAllRead: async (): Promise<void> => {
    await axios.put('/notifications/mark-all-read/');
  },
  getPreferences: async (): Promise<NotificationPreferences> => {
    const res = await axios.get<NotificationPreferences>('/notifications/preferences/');
    return res.data;
  },
  updatePreferences: async (payload: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const res = await axios.put<NotificationPreferences>('/notifications/preferences/', payload);
    return res.data;
  },
};
