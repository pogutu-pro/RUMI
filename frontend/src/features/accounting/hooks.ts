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
