import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { toast } from 'sonner';
import type {
  GetNotificationsParams,
  UpdatePreferencesRequest,
} from '@/lib/api/notifications';

/**
 * Hook to fetch paginated notifications
 * @param params - Query parameters for filtering/pagination
 * @returns Query result with notifications data
 */
export const useNotifications = (params?: GetNotificationsParams) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getNotifications(params),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for real-time updates
  });
};

/**
 * Hook to get unread notification count
 * @returns Query result with unread count
 */
export const useUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
};

/**
 * Hook to mark a notification as read
 * @returns Mutation for marking notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    },
  });
};

/**
 * Hook to mark multiple notifications as read
 * @returns Mutation for marking multiple notifications as read
 */
export const useMarkMultipleNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      notificationsApi.markMultipleAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      toast.success('Notifications marked as read');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to mark notifications as read';
      toast.error(message);
    },
  });
};

/**
 * Hook to mark all notifications as read
 * @returns Mutation for marking all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to mark all as read';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a notification
 * @returns Mutation for deleting notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      toast.success('Notification deleted');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete notification';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete all read notifications
 * @returns Mutation for deleting all read notifications
 */
export const useDeleteAllReadNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.deleteAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All read notifications deleted');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete notifications';
      toast.error(message);
    },
  });
};

/**
 * Hook to get notification preferences
 * @returns Query result with preferences data
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to update notification preferences
 * @returns Mutation for updating preferences
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePreferencesRequest) =>
      notificationsApi.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update preferences';
      toast.error(message);
    },
  });
};
