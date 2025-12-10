import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import {
  damageReportsApi,
  type DamageReport,
  type DamageReportListParams,
  type CreateDamageReportPayload,
} from '@/lib/api/damage-reports';

export const useDamageReports = (params?: DamageReportListParams) => {
  return useQuery<DamageReport[], Error>({
    queryKey: queryKeys.damageReports.list(
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => damageReportsApi.getDamageReports(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useDamageReport = (id: string | undefined) => {
  return useQuery<DamageReport, Error>({
    queryKey: queryKeys.damageReports.detail(id ?? ''),
    queryFn: () => damageReportsApi.getDamageReport(id as string),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useCreateDamageReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDamageReportPayload) =>
      damageReportsApi.createDamageReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.damageReports.all });
    },
  });
};
