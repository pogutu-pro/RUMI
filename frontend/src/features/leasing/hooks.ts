'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiErrorMessage, saveBlob } from '@/features/ledger/lib/format';
import { leasingApi } from './api';
import type { DebtCase, RentReview } from './types';

export const useTenancyDocuments = (tenancyId: string | undefined) =>
  useQuery({ queryKey: ['leasing', 'documents', tenancyId], queryFn: () => leasingApi.documents(tenancyId as string), enabled: !!tenancyId });
export const useArrears = () => useQuery({ queryKey: ['leasing', 'arrears'], queryFn: leasingApi.arrears });
export const useStaff = () => useQuery({ queryKey: ['leasing', 'staff'], queryFn: leasingApi.staff });
export const useRentReviews = (tenancyId: string) =>
  useQuery({ queryKey: ['leasing', 'reviews', tenancyId], queryFn: () => leasingApi.rentReviews(tenancyId) });

function useLeasingMutation<A, R>(fn: (args: A) => Promise<R>, ok: string, fail: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leasing'] });
      qc.invalidateQueries({ queryKey: ['rental', 'tenancies'] });
      toast.success(ok);
    },
    onError: (err) => toast.error(apiErrorMessage(err, fail)),
  });
}

export const useGenerateDocument = () =>
  useLeasingMutation(
    ({ tenancyId, ...payload }: { tenancyId: string; kind: 'lease' | 'demand_note' | 'quit_notice'; send?: boolean;
      pay_within_days?: number; vacate_by?: string; reason?: string }) => leasingApi.generate(tenancyId, payload),
    'Document created', 'Could not create the document',
  );
export const useUploadDocument = () =>
  useLeasingMutation(({ tenancyId, form }: { tenancyId: string; form: FormData }) => leasingApi.upload(tenancyId, form),
    'Document uploaded', 'Could not upload the document');
export const useNoticeToVacate = () =>
  useLeasingMutation(({ tenancyId, moveOut, reason }: { tenancyId: string; moveOut: string; reason: string }) =>
    leasingApi.noticeToVacate(tenancyId, moveOut, reason), 'Notice recorded', 'Could not record the notice');
export const useOpenCase = () =>
  useLeasingMutation(leasingApi.openCase, 'Debt case opened', 'Could not open the case');
export const useUpdateCase = () =>
  useLeasingMutation(({ id, payload }: { id: string; payload: Partial<DebtCase> }) => leasingApi.updateCase(id, payload),
    'Case updated', 'Could not update the case');
export const useAddCaseNote = () =>
  useLeasingMutation(({ id, text }: { id: string; text: string }) => leasingApi.addNote(id, text), 'Note added', 'Could not add the note');
export const useScheduleReview = () =>
  useLeasingMutation(({ tenancyId, payload }: { tenancyId: string; payload: Partial<RentReview> }) =>
    leasingApi.scheduleReview(tenancyId, payload), 'Rent review scheduled — the tenant is told 30 days before', 'Could not schedule it');
export const useCancelReview = () =>
  useLeasingMutation((id: string) => leasingApi.cancelReview(id), 'Rent review cancelled', 'Could not cancel it');
export const useDownloadDocument = () =>
  useMutation({
    // Generated letters are PDFs; uploads keep their own extension (already in the title).
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => saveBlob(await leasingApi.download(id), filename),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not download the document')),
  });
