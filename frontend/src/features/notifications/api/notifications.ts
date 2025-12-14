import apiClient from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Notification, NotificationPreferences } from '@/types/auth.types';
export type { Notification, NotificationPreferences };

export interface GetNotificationsParams extends PaginationParams {
  status?: 'pending' | 'sent' | 'failed' | 'read' | 'unread';
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdatePreferencesRequest {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  marketingEmails?: boolean;
  bookingUpdates?: boolean;
  paymentReminders?: boolean;
  roommateUpdates?: boolean;
  marketplaceUpdates?: boolean;
}

/**
 * Get paginated notifications for the current user
 */
export const getNotifications = async (
  params?: GetNotificationsParams
): Promise<PaginatedResponse<Notification>> => {
  const response = await apiClient.axios.get<PaginatedResponse<Notification>>(
    '/notifications/',
    { params }
  );
  return response.data;
};

/**
 * Get a single notification by ID
 */
export const getNotification = async (
  notificationId: string
): Promise<ApiResponse<Notification>> => {
  const response = await apiClient.axios.get<ApiResponse<Notification>>(
    `/notifications/${notificationId}/`
  );
  return response.data;
};

/**
 * Get count of unread notifications
 */
export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  // Assuming this endpoint exists or we filter getNotifications
  // If not in docs, we might need to implement it or use list with status=unread
  const response = await apiClient.axios.get<ApiResponse<{ count: number }>>(
    '/notifications/unread-count/'
  );
  return response.data;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (
  notificationId: string
): Promise<ApiResponse<Notification>> => {
  const response = await apiClient.axios.put<ApiResponse<Notification>>(
    `/notifications/${notificationId}/read/`
  );
  return response.data;
};

/**
 * Mark multiple notifications as read
 */
export const markMultipleAsRead = async (
  notificationIds: string[]
): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.put<ApiResponse<void>>(
    '/notifications/mark-multiple-read/',
    { notificationIds }
  );
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.put<ApiResponse<void>>(
    '/notifications/mark-all-read/'
  );
  return response.data;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.delete<ApiResponse<void>>(
    `/notifications/${notificationId}/`
  );
  return response.data;
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.delete<ApiResponse<void>>(
    '/notifications/delete-all-read/'
  );
  return response.data;
};

/**
 * Get notification preferences
 */
export const getPreferences = async (): Promise<
  ApiResponse<NotificationPreferences>
> => {
  const response = await apiClient.axios.get<
    ApiResponse<NotificationPreferences>
  >('/notifications/preferences/');
  return response.data;
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (
  data: UpdatePreferencesRequest
): Promise<ApiResponse<NotificationPreferences>> => {
  const response = await apiClient.axios.put<
    ApiResponse<NotificationPreferences>
  >('/notifications/preferences/', data);
  return response.data;
};

// Admin Endpoints
export const getEmailTemplates = async () => {
  const response = await apiClient.axios.get<ApiResponse<any[]>>('/notifications/admin/templates/email/');
  return response.data.data || [];
};

export const getSmsTemplates = async () => {
  const response = await apiClient.axios.get<ApiResponse<any[]>>('/notifications/admin/templates/sms/');
  return response.data.data || [];
};

export const getNotificationStats = async () => {
  const response = await apiClient.axios.get<ApiResponse<any>>('/notifications/admin/stats/');
  return response.data.data;
};

export const notificationsApi = {
  getNotifications,
  getNotification,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getPreferences,
  updatePreferences,
  getEmailTemplates,
  getSmsTemplates,
  getNotificationStats,
};

/**
 * ================================================================================
 * README: Notifications API Module (notifications.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Manages user notifications - listing, marking as read, preference settings,
 * and admin notification templates.
 *
 * ENDPOINTS:
 * ----------
 * | Method | Endpoint                          | Function            |
 * |--------|----------------------------------|---------------------|
 * | GET    | /notifications/                  | getNotifications()  |
 * | GET    | /notifications/{id}/             | getNotification()   |
 * | GET    | /notifications/unread-count/     | getUnreadCount()    |
 * | PUT    | /notifications/{id}/read/        | markAsRead()        |
 * | PUT    | /notifications/mark-all-read/    | markAllAsRead()     |
 * | DELETE | /notifications/{id}/             | deleteNotification()|
 * | GET    | /notifications/preferences/      | getPreferences()    |
 * | PUT    | /notifications/preferences/      | updatePreferences() |
 *
 * PREFERENCES:
 * ------------
 * emailEnabled, smsEnabled, marketingEmails, bookingUpdates,
 * paymentReminders, roommateUpdates, marketplaceUpdates
 *
 * USAGE:
 * ------
 * ```typescript
 * import { notificationsApi } from './notifications';
 *
 * const notifications = await notificationsApi.getNotifications({ status: 'unread' });
 * await notificationsApi.markAllAsRead();
 * await notificationsApi.updatePreferences({ emailEnabled: true });
 * ```
 *
 * ================================================================================
 */
