import { axiosInstance as axios } from '@/lib/api/client';
import type { AuditLogListParams, AuditLogListResponse } from '../types';

export const adminAuditApi = {
  listLogs: async (params: AuditLogListParams): Promise<AuditLogListResponse> => {
    const res = await axios.get<AuditLogListResponse>('/audit/admin/logs/', { params });
    return res.data;
  },
};
