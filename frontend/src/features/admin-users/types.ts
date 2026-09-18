/**
 * RumiaRent super-admin user-management domain types — mirror
 * Backend/accounts/views.py's UserManagementView/UserDeactivateView/
 * UserReactivateView response shapes field-for-field.
 */

export type AdminUserRole =
  | 'tenant'
  | 'landlord'
  | 'caretaker'
  | 'tech_support'
  | 'tech_support_admin'
  | 'super_admin'
  | 'student';

export interface AdminUserRow {
  user_id: number;
  email: string;
  full_name: string;
  role: AdminUserRole;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface AdminUserListResponse {
  total_users: number;
  filters_applied: {
    role: string | null;
    is_verified: string | null;
    is_active: string | null;
    search: string | null;
  };
  users: AdminUserRow[];
}

export interface AdminUserListParams {
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
