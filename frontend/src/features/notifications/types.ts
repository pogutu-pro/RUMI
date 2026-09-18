/** Mirrors NotificationListView's response (Backend/notifications/views.py)
 * field-for-field — not the account/booking-marketplace shape some earlier
 * scaffold files in this feature assumed but never actually matched. */
export interface AppNotification {
  notification_id: number;
  type: string;
  subject: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

export interface NotificationListResponse {
  unread_count: number;
  total_count: number;
  notifications: AppNotification[];
}

export interface NotificationListParams {
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}

/** Mirrors NotificationPreferencesView's GET/PUT response — the real
 * NotificationPreference model fields, snake_case, not the invented
 * emailEnabled/paymentReminders shape some earlier scaffold files assumed. */
export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  marketing_emails: boolean;
  booking_updates: boolean;
  marketplace_updates: boolean;
  roommate_updates: boolean;
}
