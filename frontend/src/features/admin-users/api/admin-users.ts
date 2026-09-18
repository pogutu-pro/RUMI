import { axiosInstance as axios } from '@/lib/api/client';
import type { AdminUserListParams, AdminUserListResponse } from '../types';

/**
 * Super-admin/tech-support user-management consumer for
 * Backend/accounts/views.py's UserManagementView (manually paginated via
 * limit/offset, not DRF's PageNumberPagination — no {count,next,previous}
 * envelope, just {total_users, filters_applied, users}).
 */
export const adminUsersApi = {
  listUsers: async (params: AdminUserListParams): Promise<AdminUserListResponse> => {
    const res = await axios.get<AdminUserListResponse>('/accounts/users/', { params });
    return res.data;
  },
  deactivateUser: async (userId: number, reason: string): Promise<void> => {
    await axios.put(`/accounts/users/${userId}/deactivate/`, { reason, notify_user: true });
  },
  reactivateUser: async (userId: number): Promise<void> => {
    await axios.put(`/accounts/users/${userId}/reactivate/`);
  },
};
