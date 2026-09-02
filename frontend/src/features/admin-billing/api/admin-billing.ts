import { axiosInstance as axios } from '@/lib/api/client';
import type { AdminBillingDetail, AdminBillingListRow, AdminOverridePayload } from '../types';

/**
 * Super-admin-only billing consumer for Plan 06-03's three new endpoints.
 * Endpoints return raw serialized data (no {success, data} envelope) —
 * same convention as frontend/src/features/rental/api/client.ts.
 */
export const adminBillingApi = {
  listOrganizations: async (search?: string): Promise<AdminBillingListRow[]> => {
    const res = await axios.get<AdminBillingListRow[]>('/billing/admin/organizations/', {
      params: search ? { search } : undefined,
    });
    return res.data;
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
