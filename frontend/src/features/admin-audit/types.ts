/** Mirrors AdminAuditLogListView's response (Backend/audit/views.py). */
export interface AuditLogEntry {
  id: string;
  action: string;
  actor_email: string | null;
  organization_name: string | null;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type AuditLogListResponse = PaginatedResponse<AuditLogEntry>;

export interface AuditLogListParams {
  action?: string;
  page?: number;
}
