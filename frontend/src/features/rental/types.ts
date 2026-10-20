/**
 * RumiaRent rental domain types — mirror rumia_api/serializers.py exactly.
 * Kept in one file deliberately: this is a small, focused feature, not a
 * platform — see rumia_api PAYMENT PROVIDER AUDIT / product-scope notes.
 */

export type PropertyStatus = 'active' | 'inactive' | 'under_maintenance';
export type UnitStatus = 'vacant' | 'occupied' | 'reserved' | 'maintenance';
export type TenancyStatus = 'pending' | 'active' | 'notice_period' | 'expired' | 'terminated';
export type TenantStatus = 'prospect' | 'active' | 'notice_period' | 'former' | 'archived';
export type RentChargeStatus =
  | 'upcoming' | 'due' | 'partially_paid' | 'paid' | 'overdue' | 'waived' | 'disputed';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'reversed' | 'disputed';

export interface CaretakerAssignedProperty {
  id: string;
  name: string;
}

export interface Caretaker {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  permissions: Record<string, boolean>;
  assigned_properties: CaretakerAssignedProperty[];
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  organization: string;
  /** Agency package: the property owner it is managed for (null = the organization owns it). */
  owner?: string | null;
  name: string;
  property_type: string;
  description: string;
  address: string;
  county: string;
  city: string;
  status: PropertyStatus;
  default_monthly_rent: string | null;
  currency: string;
  total_units: number;
  created_at: string;
  updated_at: string;
}

export interface RentalUnit {
  id: string;
  organization: string;
  property: string;
  building: string | null;
  floor: string | null;
  unit_number: string;
  unit_type: string;
  monthly_rent: string;
  deposit: string;
  status: UnitStatus;
  /** Advertised on the public /rentals page while vacant. */
  is_listed?: boolean;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantProfile {
  id: string;
  organization: string;
  user: string | null;
  full_name: string;
  phone: string;
  email: string;
  national_id: string;
  occupation: string;
  address: string;
  status: TenantStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Tenancy {
  id: string;
  organization: string;
  property: string;
  unit: string;
  tenant: string;
  tenant_name: string;
  unit_number: string;
  property_name: string;
  start_date: string;
  end_date: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  monthly_rent: string;
  deposit: string;
  rent_due_day: number;
  grace_period_days: number;
  prorate_final_period?: boolean;
  /** Account number tenants type when paying the landlord's paybill. */
  payment_reference?: string;
  status: TenancyStatus;
  renewal_notes: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface RentCharge {
  id: string;
  organization: string;
  tenancy: string;
  property: string;
  unit: string;
  tenant: string;
  period_start: string;
  period_end: string;
  due_date: string;
  amount_due: string;
  amount_paid: string;
  late_fee_amount: string;
  outstanding: string;
  status: RentChargeStatus;
  currency: string;
  notes: string;
  created_at: string;
  // Phase 1 invoice fields (rent/ endpoints now return invoices).
  number?: string;
  invoice_type?: 'rent' | 'deposit' | 'penalty' | 'adhoc';
  tenant_name?: string;
  unit_number?: string;
  amount_credited?: string;
  is_disputed?: boolean;
}

export interface RentBalance {
  outstanding_total: string;
  overdue_total: string;
  /** Overpayments / advance payments not yet applied to an invoice. */
  credit_total?: string;
  /** outstanding_total − credit_total (negative = tenant is in credit). */
  net_balance?: string;
  charges: RentCharge[];
}

export interface Payment {
  id: string;
  organization: string;
  tenancy: string | null;
  tenant: string;
  property: string | null;
  unit: string | null;
  amount: string;
  /** Part of the payment kept as credit (not yet applied to an invoice). */
  unapplied_amount?: string;
  currency: string;
  payment_method: string;
  provider: string;
  provider_reference: string;
  internal_reference: string;
  status: PaymentStatus;
  notes?: string;
  paid_at: string | null;
  created_at: string;
  receipt?: { id: string; number: string } | null;
}

export interface PaymentInitiateResponse {
  payment_id: string;
  internal_reference: string;
  authorization_url: string;
  status: string;
}

export interface IncomeSummaryByProperty {
  property_id: string;
  property_name: string;
  expected_rent: string;
  collected_rent: string;
  outstanding_rent: string;
  collection_rate: string;
}

export interface IncomeSummary {
  organization_id: string;
  period_start: string;
  period_end: string;
  summary: {
    expected_rent: string;
    collected_rent: string;
    outstanding_rent: string;
    overdue_rent: string;
    collection_rate: string;
    vacancy_loss: string;
    projected_income: string;
  };
  by_property: IncomeSummaryByProperty[];
}
