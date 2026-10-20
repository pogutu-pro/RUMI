import { axiosInstance as axios } from '@/lib/api/client';
import type { OwnerStatement, OwnerStatementFigures, OwnerTransaction, PropertyOwner } from './types';

export const agencyApi = {
  listOwners: async (): Promise<PropertyOwner[]> => (await axios.get<PropertyOwner[]>('/agency/owners/')).data,
  createOwner: async (payload: Partial<PropertyOwner>): Promise<PropertyOwner> =>
    (await axios.post<PropertyOwner>('/agency/owners/', payload)).data,
  updateOwner: async (id: string, payload: Partial<PropertyOwner>): Promise<PropertyOwner> =>
    (await axios.patch<PropertyOwner>(`/agency/owners/${id}/`, payload)).data,
  preview: async (id: string, month: string): Promise<OwnerStatementFigures> =>
    (await axios.get<OwnerStatementFigures>(`/agency/owners/${id}/statement-preview/`, { params: { month } })).data,
  listStatements: async (id: string): Promise<OwnerStatement[]> =>
    (await axios.get<OwnerStatement[]>(`/agency/owners/${id}/statements/`)).data,
  approveStatement: async (id: string, month: string): Promise<OwnerStatement> =>
    (await axios.post<OwnerStatement>(`/agency/owners/${id}/statements/`, { month })).data,
  statementPdf: async (statementId: string): Promise<Blob> =>
    (await axios.get(`/agency/statements/${statementId}/pdf/`, { responseType: 'blob' })).data as Blob,
  listTransactions: async (id: string): Promise<OwnerTransaction[]> =>
    (await axios.get<OwnerTransaction[]>(`/agency/owners/${id}/transactions/`)).data,
  recordTransaction: async (id: string, payload: Partial<OwnerTransaction>): Promise<OwnerTransaction> =>
    (await axios.post<OwnerTransaction>(`/agency/owners/${id}/transactions/`, payload)).data,
  setPropertyOwner: async (propertyId: string, ownerId: string | null) =>
    (await axios.patch(`/properties/${propertyId}/`, { owner: ownerId })).data,
};
