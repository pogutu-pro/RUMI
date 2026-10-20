'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiErrorMessage, saveBlob } from '@/features/ledger/lib/format';
import { booksApi } from './api';

export const useStatement = (month: string, propertyId?: string) =>
  useQuery({
    queryKey: ['accounting', 'statement', month, propertyId ?? 'all'],
    queryFn: () => booksApi.getStatement(month, propertyId),
  });

export const useDownloadStatement = () =>
  useMutation({
    mutationFn: async ({ month, propertyId }: { month: string; propertyId?: string }) =>
      saveBlob(await booksApi.downloadStatement(month, propertyId), `statement-${month}.pdf`),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not download the statement')),
  });

export const useReport = (report: string, params: Record<string, string>) =>
  useQuery({ queryKey: ['accounting', 'report', report, params], queryFn: () => booksApi.report(report, params) });
export const useSuppliers = () => useQuery({ queryKey: ['accounting', 'suppliers'], queryFn: booksApi.suppliers });
export const useStatementLines = (status?: string) =>
  useQuery({ queryKey: ['accounting', 'lines', status ?? 'all'], queryFn: () => booksApi.statementLines(status) });

function useAccountingMutation<A, R>(fn: (args: A) => Promise<R>, ok: string, fail: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      qc.invalidateQueries({ queryKey: ['rental'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      toast.success(ok);
    },
    onError: (err) => toast.error(apiErrorMessage(err, fail)),
  });
}

export const useCreateSupplier = () => useAccountingMutation(booksApi.createSupplier, 'Supplier added', 'Could not add the supplier');
export const usePostJournal = () => useAccountingMutation(booksApi.postJournal, 'Journal entry posted', 'Could not post the entry');
export const useImportStatement = () =>
  useAccountingMutation(booksApi.importStatement, 'Statement imported', 'Could not import the statement');
export const useAssignLine = () =>
  useAccountingMutation(({ id, tenancy }: { id: string; tenancy: string }) => booksApi.assignLine(id, tenancy),
    'Recorded as a tenant payment — receipt sent', 'Could not record it');
export const useIgnoreLine = () =>
  useAccountingMutation(({ id, note }: { id: string; note: string }) => booksApi.ignoreLine(id, note), 'Marked as not rent', 'Could not update it');
