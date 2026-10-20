/** Mirrors Backend/leasing/views.py serializers. */
export type DocumentKind = 'lease' | 'demand_note' | 'quit_notice' | 'notice_to_vacate' | 'id_copy' | 'other';

export interface TenancyDocument {
  id: string;
  tenancy: string;
  kind: DocumentKind;
  kind_label: string;
  title: string;
  generated: boolean;
  visible_to_tenant: boolean;
  details: Record<string, unknown>;
  sent_at: string | null;
  created_at: string;
}

export type DebtStatus = 'open' | 'promised' | 'escalated' | 'closed';

export interface DebtCase {
  id: string;
  tenancy: string;
  tenant_name: string;
  unit_number: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  status: DebtStatus;
  amount_at_open: string;
  arrears_now: string;
  promise_date: string | null;
  promise_amount: string | null;
  closed_reason: string;
  notes: { text: string; author: string; created_at: string }[];
  created_at: string;
  updated_at: string;
}

export interface ArrearsRow {
  tenancy: string;
  tenant_name: string;
  phone: string;
  unit_number: string;
  property_name: string;
  status: string;
  arrears: string;
  case: DebtCase | null;
}

export interface RentReview {
  id: string;
  tenancy: string;
  effective_date: string;
  new_monthly_rent: string | null;
  increase_percent: string | null;
  repeat_annually: boolean;
  notified_at: string | null;
  applied_at: string | null;
  previous_rent: string | null;
  applied_rent: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface StaffMember { id: number; name: string; role: string }
