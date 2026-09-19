'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { accountingApi } from '../api/accounting';
import type { ExpenseInput } from '../types';

// Books change as payments arrive and expenses are added; do not serve five-minute-old figures.
const LIVE = { staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true } as const;

const message = (err: unknown, fallback: string) => (err as { message?: string })?.message || fallback;

export const useMriMonth = (month: string) =>
  useQuery({ queryKey: ['accounting', 'mri', month], queryFn: () => accountingApi.mriMonth(month), ...LIVE });

export const useMriYear = (year: number) =>
  useQuery({ queryKey: ['accounting', 'mri-year', year], queryFn: () => accountingApi.mriYear(year), ...LIVE });

export const useTaxProfile = () =>
  useQuery({ queryKey: ['accounting', 'tax-profile'], queryFn: accountingApi.taxProfile });

export const useSummary = (month: string) =>
  useQuery({ queryKey: ['accounting', 'summary', month], queryFn: () => accountingApi.summary(month), ...LIVE });

export const useExpenses = (month: string, page: number) =>
  useQuery({
    queryKey: ['accounting', 'expenses', month, page],
    queryFn: () => accountingApi.expenses({ month, page }),
    placeholderData: (previous) => previous,
    ...LIVE,
  });

function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['accounting'] });
}

export const useMarkFiled = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ month, reference }: { month: string; reference: string }) => accountingApi.markFiled(month, reference),
    onSuccess: () => { refresh(); toast.success('Marked as filed'); },
    onError: (err) => toast.error(message(err, 'Could not mark it as filed')),
  });
};

export const useUnmarkFiled = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (month: string) => accountingApi.unmarkFiled(month),
    onSuccess: () => { refresh(); toast.success('Filing mark removed'); },
    onError: (err) => toast.error(message(err, 'Could not undo that')),
  });
};

export const useSaveKraPin = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (pin: string) => accountingApi.saveKraPin(pin),
    onSuccess: () => { refresh(); toast.success('KRA PIN saved'); },
  });
};

export const useSaveExpense = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ExpenseInput }) =>
      id ? accountingApi.updateExpense(id, input) : accountingApi.createExpense(input),
    onSuccess: (_, { id }) => { refresh(); toast.success(id ? 'Expense updated' : 'Expense recorded'); },
  });
};

export const useVoidExpense = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => accountingApi.voidExpense(id, reason),
    onSuccess: () => { refresh(); toast.success('Expense removed from your books'); },
    onError: (err) => toast.error(message(err, 'Could not remove the expense')),
  });
};
