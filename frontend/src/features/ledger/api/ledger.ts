import { axiosInstance as axios } from '@/lib/api/client';
import type {
  CreditNote,
  DepositDeduction,
  DepositSettlement,
  DepositSummary,
  ExtraLineType,
  Invoice,
  InvoiceDetail,
  MeterReading,
  PenaltyPolicy,
  Receipt,
  RecurringCharge,
  RefundMethod,
  Utility,
  UtilityRates,
} from '../types';

/**
 * Phase 1 ledger endpoints (Backend/rumia_api/ledger_views.py). Raw
 * serialized data, no envelope — same convention as features/rental.
 */
export const ledgerApi = {
  // Invoices
  listInvoices: async (params?: {
    status?: string;
    invoice_type?: string;
    tenancy_id?: string;
  }): Promise<Invoice[]> => {
    const res = await axios.get<Invoice[]>('/invoices/', { params });
    return res.data;
  },
  getInvoice: async (id: string): Promise<InvoiceDetail> => {
    const res = await axios.get<InvoiceDetail>(`/invoices/${id}/`);
    return res.data;
  },
  createAdhocInvoice: async (payload: {
    tenancy: string;
    due_date: string;
    notes?: string;
    lines: { line_type: ExtraLineType; description?: string; quantity?: string; unit_price: string }[];
  }): Promise<Invoice> => {
    const res = await axios.post<Invoice>('/invoices/', payload);
    return res.data;
  },
  issueCreditNote: async (invoiceId: string, payload: { amount: string; reason: string }): Promise<CreditNote> => {
    const res = await axios.post<CreditNote>(`/invoices/${invoiceId}/credit-notes/`, payload);
    return res.data;
  },
  setDisputed: async (invoiceId: string, disputed: boolean, note?: string): Promise<Invoice> => {
    const res = await axios.post<Invoice>(`/invoices/${invoiceId}/dispute/`, { disputed, note });
    return res.data;
  },

  // Receipts
  listReceipts: async (tenancyId?: string): Promise<Receipt[]> => {
    const res = await axios.get<Receipt[]>('/receipts/', {
      params: tenancyId ? { tenancy_id: tenancyId } : undefined,
    });
    return res.data;
  },
  downloadReceiptPdf: async (receiptId: string): Promise<Blob> => {
    const res = await axios.get(`/receipts/${receiptId}/pdf/`, { responseType: 'blob' });
    return res.data as Blob;
  },
  resendReceipt: async (receiptId: string): Promise<void> => {
    await axios.post(`/receipts/${receiptId}/resend/`, {});
  },

  // Payments
  reversePayment: async (paymentId: string, reason: string) => {
    const res = await axios.post(`/rent/payments/${paymentId}/reverse/`, { reason });
    return res.data;
  },

  // Recurring charges
  listRecurringCharges: async (tenancyId: string): Promise<RecurringCharge[]> => {
    const res = await axios.get<RecurringCharge[]>(`/tenancies/${tenancyId}/recurring-charges/`);
    return res.data;
  },
  createRecurringCharge: async (
    tenancyId: string,
    payload: { line_type: ExtraLineType; description?: string; amount: string; start_date: string; end_date?: string | null },
  ): Promise<RecurringCharge> => {
    const res = await axios.post<RecurringCharge>(`/tenancies/${tenancyId}/recurring-charges/`, payload);
    return res.data;
  },
  stopRecurringCharge: async (id: string): Promise<void> => {
    await axios.delete(`/recurring-charges/${id}/`);
  },

  // Deposits
  getDeposit: async (tenancyId: string): Promise<DepositSummary> => {
    const res = await axios.get<DepositSummary>(`/tenancies/${tenancyId}/deposit/`);
    return res.data;
  },
  invoiceDeposit: async (tenancyId: string, amount?: string): Promise<Invoice> => {
    const res = await axios.post<Invoice>(`/tenancies/${tenancyId}/deposit/invoice/`, amount ? { amount } : {});
    return res.data;
  },
  recordDepositHeld: async (
    tenancyId: string,
    payload: { amount: string; method: RefundMethod; reference?: string; received_on?: string },
  ) => {
    const res = await axios.post(`/tenancies/${tenancyId}/deposit/record-held/`, payload);
    return res.data;
  },
  createDepositSettlement: async (
    tenancyId: string,
    payload: { deductions: DepositDeduction[]; include_arrears: boolean; notes?: string },
  ): Promise<DepositSettlement> => {
    const res = await axios.post<DepositSettlement>(`/tenancies/${tenancyId}/deposit/settlements/`, payload);
    return res.data;
  },
  settlementAction: async (
    id: string,
    action: 'approve' | 'cancel' | 'refund',
    payload?: { method: RefundMethod; reference?: string; refunded_on?: string },
  ): Promise<DepositSettlement> => {
    const res = await axios.post<DepositSettlement>(`/deposit-settlements/${id}/${action}/`, payload ?? {});
    return res.data;
  },

  // Penalty policy
  getPenaltyPolicy: async (propertyId?: string): Promise<PenaltyPolicy> => {
    const res = await axios.get<PenaltyPolicy>('/penalty-policy/', {
      params: propertyId ? { property_id: propertyId } : undefined,
    });
    return res.data;
  },
  savePenaltyPolicy: async (payload: Partial<PenaltyPolicy>, propertyId?: string): Promise<PenaltyPolicy> => {
    const res = await axios.put<PenaltyPolicy>('/penalty-policy/', payload, {
      params: propertyId ? { property_id: propertyId } : undefined,
    });
    return res.data;
  },

  // Utilities
  listMeterReadings: async (params?: { unit_id?: string; utility?: Utility; billed?: 'true' | 'false' }) => {
    const res = await axios.get<MeterReading[]>('/meter-readings/', { params });
    return res.data;
  },
  recordMeterReading: async (payload: {
    unit: string;
    utility: Utility;
    reading_date: string;
    value: string;
    rate_per_unit?: string;
    notes?: string;
  }): Promise<MeterReading> => {
    const res = await axios.post<MeterReading>('/meter-readings/', payload);
    return res.data;
  },
  billUtilitiesNow: async (tenancyId: string): Promise<Invoice> => {
    const res = await axios.post<Invoice>(`/tenancies/${tenancyId}/utilities/bill-now/`, {});
    return res.data;
  },
  getUtilityRates: async (propertyId: string): Promise<UtilityRates> => {
    const res = await axios.get<UtilityRates>(`/properties/${propertyId}/utility-rates/`);
    return res.data;
  },
  saveUtilityRates: async (propertyId: string, rates: UtilityRates): Promise<UtilityRates> => {
    const res = await axios.put<UtilityRates>(`/properties/${propertyId}/utility-rates/`, rates);
    return res.data;
  },
};
