'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ledgerApi } from '../api/ledger';
import { apiErrorMessage, saveBlob } from '../lib/format';
import type { DepositDeduction, PenaltyPolicy, RefundMethod, UtilityRates } from '../types';

export const ledgerKeys = {
  invoices: (filters?: Record<string, string | undefined>) => ['ledger', 'invoices', filters ?? {}] as const,
  invoice: (id: string) => ['ledger', 'invoice', id] as const,
  receipts: (tenancyId?: string) => ['ledger', 'receipts', tenancyId ?? 'all'] as const,
  recurring: (tenancyId: string) => ['ledger', 'recurring', tenancyId] as const,
  deposit: (tenancyId: string) => ['ledger', 'deposit', tenancyId] as const,
  penaltyPolicy: (propertyId?: string) => ['ledger', 'penalty-policy', propertyId ?? 'org'] as const,
  meterReadings: (unitId?: string) => ['ledger', 'meter-readings', unitId ?? 'all'] as const,
  utilityRates: (propertyId: string) => ['ledger', 'utility-rates', propertyId] as const,
};

/** Anything that moves money changes balances shown across rental + ledger screens. */
function invalidateMoney(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['ledger'] });
  qc.invalidateQueries({ queryKey: ['rental', 'rent-charges'] });
  qc.invalidateQueries({ queryKey: ['rental', 'rent-balance'] });
  qc.invalidateQueries({ queryKey: ['rental', 'payments'] });
  qc.invalidateQueries({ queryKey: ['rental', 'income-summary'] });
}

// -- Invoices --

export const useInvoices = (filters?: { status?: string; invoice_type?: string; tenancy_id?: string }) =>
  useQuery({ queryKey: ledgerKeys.invoices(filters), queryFn: () => ledgerApi.listInvoices(filters) });

export const useInvoice = (id: string | null) =>
  useQuery({
    queryKey: ledgerKeys.invoice(id ?? ''),
    queryFn: () => ledgerApi.getInvoice(id as string),
    enabled: !!id,
  });

export const useCreateAdhocInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ledgerApi.createAdhocInvoice,
    onSuccess: (invoice) => {
      invalidateMoney(qc);
      toast.success(`Invoice ${invoice.number} created`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create the invoice')),
  });
};

export const useIssueCreditNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, amount, reason }: { invoiceId: string; amount: string; reason: string }) =>
      ledgerApi.issueCreditNote(invoiceId, { amount, reason }),
    onSuccess: (note) => {
      invalidateMoney(qc);
      toast.success(`Credit note ${note.number} issued`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not issue the credit note')),
  });
};

export const useSetDisputed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, disputed, note }: { invoiceId: string; disputed: boolean; note?: string }) =>
      ledgerApi.setDisputed(invoiceId, disputed, note),
    onSuccess: (_invoice, vars) => {
      invalidateMoney(qc);
      toast.success(vars.disputed ? 'Dispute raised — your landlord has been notified' : 'Dispute cleared');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update the dispute')),
  });
};

// -- Receipts & payments --

export const useReceipts = (tenancyId?: string) =>
  useQuery({ queryKey: ledgerKeys.receipts(tenancyId), queryFn: () => ledgerApi.listReceipts(tenancyId) });

export const useDownloadReceipt = () =>
  useMutation({
    mutationFn: async ({ id, number }: { id: string; number: string }) => {
      saveBlob(await ledgerApi.downloadReceiptPdf(id), `${number}.pdf`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not download the receipt')),
  });

export const useResendReceipt = () =>
  useMutation({
    mutationFn: (id: string) => ledgerApi.resendReceipt(id),
    onSuccess: () => toast.success('Receipt is being re-sent to the tenant'),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not resend the receipt')),
  });

export const useReversePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      ledgerApi.reversePayment(paymentId, reason),
    onSuccess: () => {
      invalidateMoney(qc);
      toast.success('Payment reversed — the invoices it paid are open again');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not reverse the payment')),
  });
};

// -- Recurring charges --

export const useRecurringCharges = (tenancyId: string) =>
  useQuery({ queryKey: ledgerKeys.recurring(tenancyId), queryFn: () => ledgerApi.listRecurringCharges(tenancyId) });

export const useCreateRecurringCharge = (tenancyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof ledgerApi.createRecurringCharge>[1]) =>
      ledgerApi.createRecurringCharge(tenancyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ledgerKeys.recurring(tenancyId) });
      toast.success('Added — it will appear on every rent invoice from its start date');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not add the charge')),
  });
};

export const useStopRecurringCharge = (tenancyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ledgerApi.stopRecurringCharge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ledgerKeys.recurring(tenancyId) });
      toast.success('Stopped — past invoices are unchanged');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not stop the charge')),
  });
};

// -- Deposits --

export const useDeposit = (tenancyId: string) =>
  useQuery({ queryKey: ledgerKeys.deposit(tenancyId), queryFn: () => ledgerApi.getDeposit(tenancyId) });

export const useInvoiceDeposit = (tenancyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount?: string) => ledgerApi.invoiceDeposit(tenancyId, amount),
    onSuccess: (invoice) => {
      invalidateMoney(qc);
      toast.success(`Deposit invoice ${invoice.number} sent to the tenant`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not invoice the deposit')),
  });
};

export const useRecordDepositHeld = (tenancyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: string; method: RefundMethod; reference?: string; received_on?: string }) =>
      ledgerApi.recordDepositHeld(tenancyId, payload),
    onSuccess: () => {
      invalidateMoney(qc);
      toast.success('Deposit recorded as held');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not record the deposit')),
  });
};

export const useCreateDepositSettlement = (tenancyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { deductions: DepositDeduction[]; include_arrears: boolean; notes?: string }) =>
      ledgerApi.createDepositSettlement(tenancyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ledgerKeys.deposit(tenancyId) });
      toast.success('Settlement drafted — review it, then approve');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not draft the settlement')),
  });
};

export const useSettlementAction = (tenancyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      payload,
    }: {
      id: string;
      action: 'approve' | 'cancel' | 'refund';
      payload?: { method: RefundMethod; reference?: string; refunded_on?: string };
    }) => ledgerApi.settlementAction(id, action, payload),
    onSuccess: (_s, vars) => {
      invalidateMoney(qc);
      qc.invalidateQueries({ queryKey: ledgerKeys.deposit(tenancyId) });
      toast.success(
        vars.action === 'approve' ? 'Settlement approved' : vars.action === 'refund' ? 'Refund recorded' : 'Draft cancelled',
      );
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update the settlement')),
  });
};

// -- Penalty policy --

export const usePenaltyPolicy = (propertyId?: string) =>
  useQuery({ queryKey: ledgerKeys.penaltyPolicy(propertyId), queryFn: () => ledgerApi.getPenaltyPolicy(propertyId) });

export const useSavePenaltyPolicy = (propertyId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PenaltyPolicy>) => ledgerApi.savePenaltyPolicy(payload, propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ledger', 'penalty-policy'] });
      toast.success('Late-penalty rules saved');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save the rules')),
  });
};

// -- Utilities --

export const useMeterReadings = (unitId?: string) =>
  useQuery({
    queryKey: ledgerKeys.meterReadings(unitId),
    queryFn: () => ledgerApi.listMeterReadings(unitId ? { unit_id: unitId } : undefined),
  });

export const useRecordMeterReading = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ledgerApi.recordMeterReading,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ledger', 'meter-readings'] });
      toast.success('Reading saved — usage is billed on the next rent invoice');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save the reading')),
  });
};

export const useBillUtilitiesNow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tenancyId: string) => ledgerApi.billUtilitiesNow(tenancyId),
    onSuccess: (invoice) => {
      invalidateMoney(qc);
      toast.success(`Invoice ${invoice.number} created for utilities`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Nothing to bill')),
  });
};

export const useUtilityRates = (propertyId: string | undefined) =>
  useQuery({
    queryKey: ledgerKeys.utilityRates(propertyId ?? ''),
    queryFn: () => ledgerApi.getUtilityRates(propertyId as string),
    enabled: !!propertyId,
  });

export const useSaveUtilityRates = (propertyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rates: UtilityRates) => ledgerApi.saveUtilityRates(propertyId, rates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ledgerKeys.utilityRates(propertyId) });
      toast.success('Utility rates saved');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save the rates')),
  });
};
