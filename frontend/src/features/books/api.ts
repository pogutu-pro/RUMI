import { axiosInstance as axios } from '@/lib/api/client';
import type { Statement, StatementLine } from './types';

export const booksApi = {
  getStatement: async (month: string, propertyId?: string): Promise<Statement> =>
    (await axios.get<Statement>('/accounting/statements/', {
      params: { month, ...(propertyId ? { property_id: propertyId } : {}) },
    })).data,
  report: async (report: string, params: Record<string, string> = {}) =>
    (await axios.get('/accounting/reports/', { params: { report, ...params } })).data,
  suppliers: async (): Promise<{ id: string; name: string; phone: string; category: string }[]> =>
    (await axios.get('/accounting/suppliers/')).data,
  createSupplier: async (payload: { name: string; phone?: string; email?: string; category?: string }) =>
    (await axios.post('/accounting/suppliers/', payload)).data,
  postJournal: async (payload: { entry_date: string; memo: string; lines: { account: string; debit?: string; credit?: string }[] }) =>
    (await axios.post('/accounting/journals/', payload)).data,
  statementLines: async (status?: string): Promise<StatementLine[]> =>
    (await axios.get<StatementLine[]>('/accounting/reconciliation/', { params: status ? { status } : undefined })).data,
  importStatement: async (form: FormData) =>
    (await axios.post('/accounting/reconciliation/', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  assignLine: async (id: string, tenancy: string) =>
    (await axios.post(`/accounting/reconciliation/lines/${id}/assign/`, { tenancy })).data,
  ignoreLine: async (id: string, note: string) =>
    (await axios.post(`/accounting/reconciliation/lines/${id}/ignore/`, { note })).data,
  downloadStatement: async (month: string, propertyId?: string): Promise<Blob> =>
    (await axios.get('/accounting/statements/', {
      params: { month, export: 'pdf', ...(propertyId ? { property_id: propertyId } : {}) },
      responseType: 'blob',
    })).data as Blob,
};
