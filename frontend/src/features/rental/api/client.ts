import { axiosInstance as axios } from '@/lib/api/client';
import type {
  Payment,
  PaymentInitiateResponse,
  Property,
  RentalUnit,
  RentBalance,
  RentCharge,
  Tenancy,
  TenantProfile,
} from '../types';

/**
 * RUMIA rental API client. Endpoints return raw serialized data (no
 * {success, data} envelope) — see Backend/rumia_api/views.py.
 */
export const rentalApi = {
  // Properties
  listProperties: async (): Promise<Property[]> => {
    const res = await axios.get<Property[]>('/properties/');
    return res.data;
  },
  getProperty: async (id: string): Promise<Property> => {
    const res = await axios.get<Property>(`/properties/${id}/`);
    return res.data;
  },
  createProperty: async (payload: Partial<Property>): Promise<Property> => {
    const res = await axios.post<Property>('/properties/', payload);
    return res.data;
  },
  updateProperty: async (id: string, payload: Partial<Property>): Promise<Property> => {
    const res = await axios.patch<Property>(`/properties/${id}/`, payload);
    return res.data;
  },
  archiveProperty: async (id: string): Promise<Property> => {
    const res = await axios.delete<Property>(`/properties/${id}/`);
    return res.data;
  },

  // Units
  listUnits: async (propertyId?: string): Promise<RentalUnit[]> => {
    const res = await axios.get<RentalUnit[]>('/units/', {
      params: propertyId ? { property_id: propertyId } : undefined,
    });
    return res.data;
  },
  createUnit: async (payload: Record<string, unknown>): Promise<RentalUnit> => {
    const res = await axios.post<RentalUnit>('/units/', payload);
    return res.data;
  },
  updateUnit: async (id: string, payload: Partial<RentalUnit>): Promise<RentalUnit> => {
    const res = await axios.patch<RentalUnit>(`/units/${id}/`, payload);
    return res.data;
  },

  // Tenants
  listTenants: async (): Promise<TenantProfile[]> => {
    const res = await axios.get<TenantProfile[]>('/tenants/');
    return res.data;
  },
  createTenant: async (payload: Record<string, unknown>): Promise<TenantProfile> => {
    const res = await axios.post<TenantProfile>('/tenants/', payload);
    return res.data;
  },

  // Tenancies
  listTenancies: async (): Promise<Tenancy[]> => {
    const res = await axios.get<Tenancy[]>('/tenancies/');
    return res.data;
  },
  createTenancy: async (payload: Record<string, unknown>): Promise<Tenancy> => {
    const res = await axios.post<Tenancy>('/tenancies/', payload);
    return res.data;
  },
  terminateTenancy: async (id: string, moveOutDate?: string): Promise<Tenancy> => {
    const res = await axios.post<Tenancy>(`/tenancies/${id}/terminate/`, {
      move_out_date: moveOutDate,
    });
    return res.data;
  },

  // Rent
  listRentCharges: async (params?: { status?: string }): Promise<RentCharge[]> => {
    const res = await axios.get<RentCharge[]>('/rent/', { params });
    return res.data;
  },
  getRentBalance: async (tenancyId?: string): Promise<RentBalance> => {
    const res = await axios.get<RentBalance>('/rent/balance/', {
      params: tenancyId ? { tenancy_id: tenancyId } : undefined,
    });
    return res.data;
  },
  generateRentCharges: async (): Promise<{ created: number; tenancies_up_to_date: number }> => {
    const res = await axios.post('/rent/generate/', {});
    return res.data;
  },

  // Payments
  listPayments: async (): Promise<Payment[]> => {
    const res = await axios.get<Payment[]>('/rent/payments/');
    return res.data;
  },
  initiatePayment: async (
    tenancyId: string,
    amount: string,
  ): Promise<PaymentInitiateResponse> => {
    const res = await axios.post<PaymentInitiateResponse>('/rent/payments/', {
      tenancy: tenancyId,
      amount,
    });
    return res.data;
  },
  recordManualPayment: async (payload: {
    tenancy: string;
    amount: string;
    payment_method?: string;
    notes?: string;
    rent_charge_id?: string;
  }): Promise<Payment> => {
    const res = await axios.post<Payment>('/rent/payments/manual/', payload);
    return res.data;
  },
};
