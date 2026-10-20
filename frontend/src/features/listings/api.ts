import { axiosInstance as axios } from '@/lib/api/client';

export interface Listing {
  id: string;
  unit_type: string;
  monthly_rent: string;
  deposit: string;
  amenities: string[];
  images: string[];
  property_name: string;
  property_type: string;
  city: string;
  county: string;
  description: string;
  listed_by: string;
}

export interface Enquiry {
  id: string; unit: string; property: string; name: string; phone: string; email: string; message: string;
  handled: boolean; created_at: string;
}

export const listingsApi = {
  search: async (params: Record<string, string>): Promise<Listing[]> =>
    (await axios.get<Listing[]>('/listings/', { params })).data,
  enquire: async (unitId: string, payload: { name: string; phone: string; email?: string; message?: string }) =>
    (await axios.post(`/listings/${unitId}/enquire/`, payload)).data,
  enquiries: async (): Promise<Enquiry[]> => (await axios.get<Enquiry[]>('/listings/enquiries/')).data,
  markHandled: async (id: string) => (await axios.post('/listings/enquiries/', { id })).data,
};
