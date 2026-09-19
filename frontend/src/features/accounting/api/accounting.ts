import { axiosInstance as axios } from '@/lib/api/client';
import type {
  ExportKind, Expense, ExpenseInput, MriMonth, MriYear, Summary, TaxProfile,
} from '../types';

function toFormData(input: Partial<ExpenseInput>): FormData {
  const form = new FormData();
  (Object.entries(input) as [string, unknown][]).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'receipt') {
      if (value instanceof File) form.append('receipt', value);
      return;
    }
    form.append(key, String(value));
  });
  return form;
}

export const accountingApi = {
  mriMonth: async (month: string): Promise<MriMonth> =>
    (await axios.get<MriMonth>('/accounting/mri/', { params: { month } })).data,
  mriYear: async (year: number): Promise<MriYear> =>
    (await axios.get<MriYear>('/accounting/mri/year/', { params: { year } })).data,
  markFiled: async (month: string, reference: string): Promise<MriMonth> =>
    (await axios.post<MriMonth>(`/accounting/mri/${month}/filed/`, { reference })).data,
  unmarkFiled: async (month: string): Promise<MriMonth> =>
    (await axios.delete<MriMonth>(`/accounting/mri/${month}/filed/`)).data,
  taxProfile: async (): Promise<TaxProfile> => (await axios.get<TaxProfile>('/accounting/tax-profile/')).data,
  saveKraPin: async (kra_pin: string): Promise<TaxProfile> =>
    (await axios.put<TaxProfile>('/accounting/tax-profile/', { kra_pin })).data,
  summary: async (month: string): Promise<Summary> =>
    (await axios.get<Summary>('/accounting/summary/', { params: { month } })).data,
  expenses: async (params: { month?: string; page?: number }): Promise<{ count: number; results: Expense[] }> => {
    const res = await axios.get<{ count: number; results: Expense[] }>('/accounting/expenses/', { params });
    return { count: res.data.count, results: res.data.results };
  },
  createExpense: async (input: ExpenseInput): Promise<Expense> =>
    (await axios.post<Expense>('/accounting/expenses/', toFormData(input))).data,
  updateExpense: async (id: string, input: Partial<ExpenseInput>): Promise<Expense> =>
    (await axios.patch<Expense>(`/accounting/expenses/${id}/`, toFormData(input))).data,
  voidExpense: async (id: string, reason: string): Promise<Expense> =>
    (await axios.delete<Expense>(`/accounting/expenses/${id}/`, { data: { reason } })).data,

  /** Fetched with the auth header (a plain link would not carry it), then saved as a file. */
  download: async (kind: ExportKind, params: { from?: string; to?: string; year?: number }): Promise<void> => {
    const res = await axios.get<Blob>('/accounting/export/', { params: { kind, ...params }, responseType: 'blob' });
    const disposition = String(res.headers['content-disposition'] ?? '');
    const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `${kind}.csv`;
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
