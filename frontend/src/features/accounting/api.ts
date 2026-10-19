import { axiosInstance as axios } from '@/lib/api/client';
import type { Expense, Statement } from './types';

export const accountingApi = {
  listExpenses: async (propertyId?: string): Promise<Expense[]> =>
    (await axios.get<Expense[]>('/accounting/expenses/', { params: propertyId ? { property_id: propertyId } : undefined })).data,
  createExpense: async (payload: Partial<Expense>): Promise<Expense> =>
    (await axios.post<Expense>('/accounting/expenses/', payload)).data,
  voidExpense: async (id: string, reason: string): Promise<Expense> =>
    (await axios.post<Expense>(`/accounting/expenses/${id}/void/`, { reason })).data,
  getStatement: async (month: string, propertyId?: string): Promise<Statement> =>
    (await axios.get<Statement>('/accounting/statements/', {
      params: { month, ...(propertyId ? { property_id: propertyId } : {}) },
    })).data,
  downloadStatement: async (month: string, propertyId?: string): Promise<Blob> =>
    (await axios.get('/accounting/statements/', {
      params: { month, export: 'pdf', ...(propertyId ? { property_id: propertyId } : {}) },
      responseType: 'blob',
    })).data as Blob,
};
