'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminBillingApi } from '../api/admin-billing';
import type { AdminOverridePayload } from '../types';

// Same normalized-ApiError shape convention as use-rental.ts/use-payout.ts —
// the axios interceptor already computes `.message`, never `.response`.
function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { message?: string };
  return anyErr?.message || fallback;
}

/**
 * `search` is part of the query key by design — this is what makes the
 * SearchInput's debounce trigger a backend-filtered refetch (?search=...)
 * rather than a client-side filter of already-loaded rows.
 */
export function useAdminRevenueSummary() {
  return useQuery({
    queryKey: ['admin-billing', 'revenue'],
    queryFn: adminBillingApi.getRevenueSummary,
  });
}

export function useAdminPlatformOverview() {
  return useQuery({
    queryKey: ['admin-billing', 'overview'],
    queryFn: adminBillingApi.getPlatformOverview,
  });
}

export function useAdminBillingList(search: string) {
  return useQuery({
    queryKey: ['admin-billing', 'list', search],
    queryFn: () => adminBillingApi.listOrganizations(search || undefined),
  });
}

export function useAdminBillingDetail(id: string) {
  return useQuery({
    queryKey: ['admin-billing', 'detail', id],
    queryFn: () => adminBillingApi.getOrganization(id),
    enabled: !!id,
  });
}

export function useOverrideSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminOverridePayload }) =>
      adminBillingApi.overrideSubscription(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-billing', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-billing', 'list'] });
      toast.success('Override applied');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not apply override')),
  });
}
