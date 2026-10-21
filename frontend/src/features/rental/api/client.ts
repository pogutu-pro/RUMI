import { axiosInstance as axios } from '@/lib/api/client';
import type {
  Caretaker,
  IncomeSummary,
  Organization,
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
 * RumiaRent rental API client. Endpoints return raw serialized data (no
 * {success, data} envelope) — see Backend/rumia_api/views.py.
 *
 * `organizationId` is only meaningful for super_admin (the cross-org
 * dashboard switcher) — every other role is already server-side scoped
 * to their own organization and the param is ignored if sent.
 */
export const rentalApi = {
  // Organizations (super_admin only)
  listOrganizations: async (): Promise<Organization[]> => {
    const res = await axios.get<Organization[]>('/organizations/');
    return res.data;
  },
  createOrganization: async (payload: {
    name: string;
    organization_type?: string;
  }): Promise<Organization> => {
    const res = await axios.post<Organization>('/organizations/', payload);
    return res.data;
  },

  // Caretakers
  listCaretakers: async (): Promise<Caretaker[]> => {
    const res = await axios.get<Caretaker[]>('/caretakers/');
    return res.data;
  },
  createCaretaker: async (payload: {
    full_name: string;
    email: string;
    phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    property_ids?: string[];
    permissions?: Record<string, boolean>;
  }): Promise<Caretaker> => {
    const res = await axios.post<Caretaker>('/caretakers/', payload);
    return res.data;
  },

  // Properties
  listProperties: async (organizationId?: string): Promise<Property[]> => {
    const res = await axios.get<Property[]>('/properties/', {
      params: organizationId ? { organization_id: organizationId } : undefined,
    });
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
  listUnits: async (propertyId?: string, organizationId?: string): Promise<RentalUnit[]> => {
    const res = await axios.get<RentalUnit[]>('/units/', {
      params: {
        ...(propertyId ? { property_id: propertyId } : undefined),
        ...(organizationId ? { organization_id: organizationId } : undefined),
      },
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
  listTenants: async (organizationId?: string): Promise<TenantProfile[]> => {
    const res = await axios.get<TenantProfile[]>('/tenants/', {
      params: organizationId ? { organization_id: organizationId } : undefined,
    });
    return res.data;
  },
  createTenant: async (payload: Record<string, unknown>): Promise<TenantProfile> => {
    const res = await axios.post<TenantProfile>('/tenants/', payload);
    return res.data;
  },

  // Tenancies
  listTenancies: async (organizationId?: string): Promise<Tenancy[]> => {
    const res = await axios.get<Tenancy[]>('/tenancies/', {
      params: organizationId ? { organization_id: organizationId } : undefined,
    });
    return res.data;
  },
  createTenancy: async (payload: Record<string, unknown>): Promise<Tenancy> => {
    const res = await axios.post<Tenancy>('/tenancies/', payload);
    return res.data;
  },
  /** New tenant + tenancy in one request (rolls back together). */
  moveIn: async (payload: Record<string, unknown>): Promise<Tenancy> => {
    const res = await axios.post<Tenancy>('/tenancies/move-in/', payload);
    return res.data;
  },
  updateTenancy: async (id: string, payload: Record<string, unknown>): Promise<Tenancy> => {
    const res = await axios.patch<Tenancy>(`/tenancies/${id}/`, payload);
    return res.data;
  },
  terminateTenancy: async (id: string, moveOutDate?: string): Promise<Tenancy> => {
    const res = await axios.post<Tenancy>(`/tenancies/${id}/terminate/`, {
      move_out_date: moveOutDate,
    });
    return res.data;
  },

  // Rent
  listRentCharges: async (params?: { status?: string; organizationId?: string }): Promise<RentCharge[]> => {
    const res = await axios.get<RentCharge[]>('/rent/', {
      params: {
        ...(params?.status ? { status: params.status } : undefined),
        ...(params?.organizationId ? { organization_id: params.organizationId } : undefined),
      },
    });
    return res.data;
  },
  getRentBalance: async (tenancyId?: string, organizationId?: string): Promise<RentBalance> => {
    const res = await axios.get<RentBalance>('/rent/balance/', {
      params: {
        ...(tenancyId ? { tenancy_id: tenancyId } : undefined),
        ...(organizationId ? { organization_id: organizationId } : undefined),
      },
    });
    return res.data;
  },
  generateRentCharges: async (): Promise<{ created: number; tenancies_up_to_date: number }> => {
    const res = await axios.post('/rent/generate/', {});
    return res.data;
  },

  // Payments
  listPayments: async (organizationId?: string): Promise<Payment[]> => {
    const res = await axios.get<Payment[]>('/rent/payments/', {
      params: organizationId ? { organization_id: organizationId } : undefined,
    });
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

  // Income
  getIncomeSummary: async (params?: {
    period_start?: string;
    period_end?: string;
    organizationId?: string;
  }): Promise<IncomeSummary> => {
    const res = await axios.get<IncomeSummary>('/income/', {
      params: {
        ...(params?.period_start ? { period_start: params.period_start } : undefined),
        ...(params?.period_end ? { period_end: params.period_end } : undefined),
        ...(params?.organizationId ? { organization_id: params.organizationId } : undefined),
      },
    });
    return res.data;
  },
};
