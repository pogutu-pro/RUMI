'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiErrorMessage, saveBlob } from '@/features/ledger/lib/format';
import { agencyApi } from './api';
import type { OwnerTransaction, PropertyOwner } from './types';

export const useOwners = () => useQuery({ queryKey: ['agency', 'owners'], queryFn: agencyApi.listOwners });

export const useOwnerPreview = (id: string | null, month: string) =>
  useQuery({
    queryKey: ['agency', 'preview', id, month],
    queryFn: () => agencyApi.preview(id as string, month),
    enabled: !!id,
  });

export const useOwnerStatements = (id: string | null) =>
  useQuery({ queryKey: ['agency', 'statements', id], queryFn: () => agencyApi.listStatements(id as string), enabled: !!id });

export const useOwnerTransactions = (id: string | null) =>
  useQuery({ queryKey: ['agency', 'transactions', id], queryFn: () => agencyApi.listTransactions(id as string), enabled: !!id });

function useAgencyMutation<A, R>(fn: (args: A) => Promise<R>, ok: string, fail: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency'] });
      qc.invalidateQueries({ queryKey: ['rental', 'properties'] });
      toast.success(ok);
    },
    onError: (err) => toast.error(apiErrorMessage(err, fail)),
  });
}

export const useSaveOwner = () =>
  useAgencyMutation(
    ({ id, payload }: { id?: string; payload: Partial<PropertyOwner> }) =>
      id ? agencyApi.updateOwner(id, payload) : agencyApi.createOwner(payload),
    'Owner saved', 'Could not save the owner',
  );

export const useApproveOwnerStatement = () =>
  useAgencyMutation(
    ({ id, month }: { id: string; month: string }) => agencyApi.approveStatement(id, month),
    'Statement approved and emailed to the owner', 'Could not approve the statement',
  );

export const useRecordOwnerTransaction = () =>
  useAgencyMutation(
    ({ id, payload }: { id: string; payload: Partial<OwnerTransaction> }) => agencyApi.recordTransaction(id, payload),
    'Recorded', 'Could not record it',
  );

export const useSetPropertyOwner = () =>
  useAgencyMutation(
    ({ propertyId, ownerId }: { propertyId: string; ownerId: string | null }) => agencyApi.setPropertyOwner(propertyId, ownerId),
    'Property updated', 'Could not update the property',
  );

export const useDownloadOwnerStatement = () =>
  useMutation({
    mutationFn: async ({ id, number }: { id: string; number: string }) => saveBlob(await agencyApi.statementPdf(id), `${number}.pdf`),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not download the statement')),
  });
