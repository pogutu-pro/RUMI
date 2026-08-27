/**
 * RUMIA rental domain types — mirror rumia_api/serializers.py exactly.
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

export interface Property {
  id: string;
  organization: string;
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
  start_date: string;
  end_date: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  monthly_rent: string;
  deposit: string;
  rent_due_day: number;
  grace_period_days: number;
  status: TenancyStatus;
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
}

export interface RentBalance {
  outstanding_total: string;
  overdue_total: string;
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
  currency: string;
  payment_method: string;
  provider: string;
  provider_reference: string;
  internal_reference: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentInitiateResponse {
  payment_id: string;
  internal_reference: string;
  authorization_url: string;
  status: string;
}
