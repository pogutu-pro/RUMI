/** Mirrors AdminEmailTemplateListView's response (Backend/notifications/views.py). */
export interface AdminEmailTemplate {
  template_id: number;
  name: string;
  subject: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

/** Mirrors AdminSMSTemplateListView's response. */
export interface AdminSMSTemplate {
  template_id: number;
  name: string;
  message: string;
  variables: string[];
  created_at: string;
}

/** Mirrors AdminNotificationStatsView's actual return payload — its
 * docstring advertises far more (revenue_impact, compliance, ...) than the
 * view body computes; only these fields are real. */
export interface AdminNotificationStats {
  period: string;
  total_notifications: number;
  successful_deliveries: number;
  failed_deliveries: number;
  delivery_rate: number;
  by_channel: {
    email: number;
    sms: number;
    in_app: number;
  };
  top_failed_types: { notification_type: string; count: number }[];
}
