'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/features/ledger/lib/format';
import { paybillApi } from './api';

const keys = {
  accounts: ['paybill', 'accounts'] as const,
  transactions: (status?: string) => ['paybill', 'transactions', status ?? 'all'] as const,
  instructions: ['paybill', 'instructions'] as const,
};

export const usePaybillAccounts = () => useQuery({ queryKey: keys.accounts, queryFn: paybillApi.listAccounts });

export const usePaybillTransactions = (status?: string) =>
  useQuery({
    queryKey: keys.transactions(status),
    queryFn: () => paybillApi.listTransactions(status),
    refetchInterval: 30_000, // new M-Pesa payments arrive any time
  });

export const usePaybillInstructions = () =>
  useQuery({ queryKey: keys.instructions, queryFn: paybillApi.instructions });

export const useConnectPaybill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paybillApi.connect,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.accounts });
      toast.success('Paybill added — now register it with Safaricom');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not add the paybill')),
  });
};

export const useUpdatePaybill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof paybillApi.update>[1] }) =>
      paybillApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.accounts });
      toast.success('Paybill updated');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update the paybill')),
  });
};

export const useRegisterPaybill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paybillApi.registerUrls(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.accounts });
      toast.success('Registered — Safaricom will now send payments to RumiaRent');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Safaricom registration failed')),
  });
};

export const useRotatePaybillToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paybillApi.rotateToken(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.accounts });
      toast.success('New callback address created — register again with Safaricom');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not rotate the address')),
  });
};

function useResolve<TArgs>(fn: (args: TArgs) => Promise<unknown>, success: string, failure: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paybill', 'transactions'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['rental'] });
      toast.success(success);
    },
    onError: (err) => toast.error(apiErrorMessage(err, failure)),
  });
}

export const useAssignPaybillTxn = () =>
  useResolve(
    ({ id, tenancy }: { id: string; tenancy: string }) => paybillApi.assign(id, tenancy),
    'Payment added to the tenant’s account — receipt sent',
    'Could not assign the payment',
  );

export const useIgnorePaybillTxn = () =>
  useResolve(
    ({ id, note }: { id: string; note: string }) => paybillApi.ignore(id, note),
    'Marked as not rent',
    'Could not update the payment',
  );
