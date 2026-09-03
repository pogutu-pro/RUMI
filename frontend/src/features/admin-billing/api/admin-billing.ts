import { axiosInstance as axios } from '@/lib/api/client';
import type { AdminBillingDetail, AdminBillingListRow, AdminOverridePayload } from '../types';

/** Shape of a DRF PageNumberPagination response envelope. */
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Super-admin-only billing consumer for Plan 06-03's three new endpoints.
 * Detail/override endpoints return raw serialized data (no {success, data}
 * envelope) — same convention as frontend/src/features/rental/api/client.ts.
 * The list endpoint is DRF-paginated; unwrapped here so callers keep working
 * with a plain array.
 */
export const adminBillingApi = {
  listOrganizations: async (search?: string): Promise<AdminBillingListRow[]> => {
    const res = await axios.get<PaginatedResponse<AdminBillingListRow>>('/billing/admin/organizations/', {
      params: search ? { search } : undefined,
    });
    return res.data.results;
  },
  getOrganization: async (id: string): Promise<AdminBillingDetail> => {
    const res = await axios.get<AdminBillingDetail>(`/billing/admin/organizations/${id}/`);
    return res.data;
  },
  overrideSubscription: async (id: string, payload: AdminOverridePayload): Promise<AdminBillingDetail> => {
    const res = await axios.post<AdminBillingDetail>(`/billing/admin/organizations/${id}/override/`, payload);
    return res.data;
  },
};
