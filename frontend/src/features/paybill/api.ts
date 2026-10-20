import { axiosInstance as axios } from '@/lib/api/client';
import type { PaybillAccount, PaybillInstruction, PaybillTransaction } from './types';

export const paybillApi = {
  listAccounts: async (): Promise<PaybillAccount[]> => (await axios.get<PaybillAccount[]>('/paybill/accounts/')).data,
  connect: async (payload: {
    shortcode: string;
    shortcode_type: 'paybill' | 'till';
    display_name?: string;
    environment: 'sandbox' | 'production';
    consumer_key?: string;
    consumer_secret?: string;
  }): Promise<PaybillAccount> => (await axios.post<PaybillAccount>('/paybill/accounts/', payload)).data,
  update: async (id: string, payload: Partial<PaybillAccount> & { consumer_key?: string; consumer_secret?: string }) =>
    (await axios.patch<PaybillAccount>(`/paybill/accounts/${id}/`, payload)).data,
  registerUrls: async (id: string): Promise<PaybillAccount> =>
    (await axios.post<PaybillAccount>(`/paybill/accounts/${id}/register-urls/`, {})).data,
  rotateToken: async (id: string): Promise<PaybillAccount> =>
    (await axios.post<PaybillAccount>(`/paybill/accounts/${id}/rotate-token/`, {})).data,
  listTransactions: async (status?: string): Promise<PaybillTransaction[]> =>
    (await axios.get<PaybillTransaction[]>('/paybill/transactions/', { params: status ? { status } : undefined })).data,
  assign: async (id: string, tenancy: string): Promise<PaybillTransaction> =>
    (await axios.post<PaybillTransaction>(`/paybill/transactions/${id}/assign/`, { tenancy })).data,
  ignore: async (id: string, note: string): Promise<PaybillTransaction> =>
    (await axios.post<PaybillTransaction>(`/paybill/transactions/${id}/ignore/`, { note })).data,
  instructions: async (): Promise<PaybillInstruction[]> =>
    (await axios.get<PaybillInstruction[]>('/paybill/instructions/')).data,
};
