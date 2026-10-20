import { axiosInstance as axios } from '@/lib/api/client';
import type { ArrearsRow, DebtCase, RentReview, StaffMember, TenancyDocument } from './types';

export const leasingApi = {
  documents: async (tenancyId: string): Promise<TenancyDocument[]> =>
    (await axios.get<TenancyDocument[]>(`/leasing/tenancies/${tenancyId}/documents/`)).data,
  generate: async (tenancyId: string, payload: { kind: 'lease' | 'demand_note' | 'quit_notice'; send?: boolean;
    pay_within_days?: number; vacate_by?: string; reason?: string }): Promise<TenancyDocument> =>
    (await axios.post<TenancyDocument>(`/leasing/tenancies/${tenancyId}/documents/generate/`, payload)).data,
  upload: async (tenancyId: string, form: FormData): Promise<TenancyDocument> =>
    (await axios.post<TenancyDocument>(`/leasing/tenancies/${tenancyId}/documents/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data,
  download: async (documentId: string): Promise<Blob> =>
    (await axios.get(`/leasing/documents/${documentId}/download/`, { responseType: 'blob' })).data as Blob,
  noticeToVacate: async (tenancyId: string, move_out_date: string, reason: string): Promise<TenancyDocument> =>
    (await axios.post<TenancyDocument>(`/leasing/tenancies/${tenancyId}/notice-to-vacate/`, { move_out_date, reason })).data,
  arrears: async (): Promise<ArrearsRow[]> => (await axios.get<ArrearsRow[]>('/leasing/arrears/')).data,
  staff: async (): Promise<StaffMember[]> => (await axios.get<StaffMember[]>('/leasing/staff/')).data,
  openCase: async (payload: { tenancy: string; assigned_to?: number | null; note?: string }): Promise<DebtCase> =>
    (await axios.post<DebtCase>('/leasing/debt-cases/', payload)).data,
  updateCase: async (id: string, payload: Partial<DebtCase>): Promise<DebtCase> =>
    (await axios.patch<DebtCase>(`/leasing/debt-cases/${id}/`, payload)).data,
  addNote: async (id: string, text: string): Promise<DebtCase> =>
    (await axios.post<DebtCase>(`/leasing/debt-cases/${id}/`, { text })).data,
  rentReviews: async (tenancyId: string): Promise<RentReview[]> =>
    (await axios.get<RentReview[]>(`/leasing/tenancies/${tenancyId}/rent-reviews/`)).data,
  scheduleReview: async (tenancyId: string, payload: Partial<RentReview>): Promise<RentReview> =>
    (await axios.post<RentReview>(`/leasing/tenancies/${tenancyId}/rent-reviews/`, payload)).data,
  cancelReview: async (id: string): Promise<RentReview> =>
    (await axios.post<RentReview>(`/leasing/rent-reviews/${id}/cancel/`, {})).data,
};
