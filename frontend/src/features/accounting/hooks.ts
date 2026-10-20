'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiErrorMessage, saveBlob } from '@/features/ledger/lib/format';
import { accountingApi } from './api';
import type { Expense } from './types';

export const useExpenses = (propertyId?: string) =>
  useQuery({ queryKey: ['accounting', 'expenses', propertyId ?? 'all'], queryFn: () => accountingApi.listExpenses(propertyId) });

export const useStatement = (month: string, propertyId?: string) =>
  useQuery({
    queryKey: ['accounting', 'statement', month, propertyId ?? 'all'],
    queryFn: () => accountingApi.getStatement(month, propertyId),
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Expense>) => accountingApi.createExpense(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      toast.success('Expense recorded');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not record the expense')),
  });
};

export const useVoidExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => accountingApi.voidExpense(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      toast.success('Expense voided');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not void the expense')),
  });
};

export const useDownloadStatement = () =>
  useMutation({
    mutationFn: async ({ month, propertyId }: { month: string; propertyId?: string }) =>
      saveBlob(await accountingApi.downloadStatement(month, propertyId), `statement-${month}.pdf`),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not download the statement')),
  });

export const useReport = (report: string, params: Record<string, string>) =>
  useQuery({ queryKey: ['accounting', 'report', report, params], queryFn: () => accountingApi.report(report, params) });
export const useSuppliers = () => useQuery({ queryKey: ['accounting', 'suppliers'], queryFn: accountingApi.suppliers });
export const useStatementLines = (status?: string) =>
  useQuery({ queryKey: ['accounting', 'lines', status ?? 'all'], queryFn: () => accountingApi.statementLines(status) });

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

export const useCreateSupplier = () => useAccountingMutation(accountingApi.createSupplier, 'Supplier added', 'Could not add the supplier');
export const usePostJournal = () => useAccountingMutation(accountingApi.postJournal, 'Journal entry posted', 'Could not post the entry');
export const useImportStatement = () =>
  useAccountingMutation(accountingApi.importStatement, 'Statement imported', 'Could not import the statement');
export const useAssignLine = () =>
  useAccountingMutation(({ id, tenancy }: { id: string; tenancy: string }) => accountingApi.assignLine(id, tenancy),
    'Recorded as a tenant payment — receipt sent', 'Could not record it');
export const useIgnoreLine = () =>
  useAccountingMutation(({ id, note }: { id: string; note: string }) => accountingApi.ignoreLine(id, note), 'Marked as not rent', 'Could not update it');
