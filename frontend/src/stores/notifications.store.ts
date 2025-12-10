import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (notif) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notif, id: Date.now().toString(), read: false },
      ],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
  clearAll: () => set({ notifications: [] }),
}));

/**
 * ================================================================================
 * README: Notifications Store (notifications.store.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Simple local notification state for in-app toast/alert notifications.
 * Note: This is for CLIENT-SIDE notifications, not push notifications.
 *
 * STATE:
 * ------
 * | Field          | Type           | Purpose                          |
 * |----------------|----------------|----------------------------------|
 * | notifications  | Notification[] | Array of notification objects    |
 *
 * NOTIFICATION TYPES:
 * -------------------
 * - 'info' - Informational message
 * - 'success' - Success confirmation
 * - 'warning' - Warning alert
 * - 'error' - Error message
 *
 * ACTIONS:
 * --------
 * | Action            | Description                          |
 * |-------------------|--------------------------------------|
 * | addNotification() | Add new notification (auto-generates ID) |
 * | markAsRead()      | Mark specific notification as read   |
 * | clearAll()        | Remove all notifications             |
 *
 * USAGE:
 * ------
 * ```typescript
 * import { useNotificationsStore } from '@/stores/notifications.store';
 *
 * const { notifications, addNotification, markAsRead } = useNotificationsStore();
 *
 * addNotification({ message: 'Booking confirmed!', type: 'success' });
 * ```
 *
 * ================================================================================
 */

