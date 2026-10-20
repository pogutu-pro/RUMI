'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAuditApi } from '../api/admin-audit';
import type { AuditLogListParams } from '../types';

export function useAuditLogList(params: AuditLogListParams) {
  return useQuery({
    queryKey: ['admin-audit', 'list', params],
    queryFn: () => adminAuditApi.listLogs(params),
  });
}
