/**
 * Phase 1 tenant-ledger types — mirror Backend/rumia_api/serializers.py.
 * Money values are decimal strings ("22000.00"), never floats.
 */
import type { RentChargeStatus } from '@/features/rental/types';

export type InvoiceType = 'rent' | 'deposit' | 'penalty' | 'adhoc';

export type LineType =
  | 'rent'
  | 'service_charge'
  | 'water'
  | 'electricity'
  | 'garbage'
  | 'parking'
  | 'penalty'
  | 'deposit'
  | 'repair'
  | 'other';

/** Line types a landlord can bill ad hoc or as a recurring extra. */
export type ExtraLineType = Exclude<LineType, 'rent' | 'penalty' | 'deposit'>;

export interface InvoiceLine {
  id: string;
  line_type: LineType;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
}

export interface Invoice {
  id: string;
  number: string;
  invoice_type: InvoiceType;
  organization: string;
  tenancy: string;
  property: string;
  unit: string;
  tenant: string;
  tenant_name: string;
  unit_number: string;
  issue_date: string | null;
  period_start: string;
  period_end: string;
  due_date: string;
  amount_due: string;
  amount_paid: string;
  amount_credited: string;
  late_fee_amount: string;
  outstanding: string;
  status: RentChargeStatus;
  is_disputed: boolean;
  currency: string;
  notes: string;
  lines: InvoiceLine[];
  source_invoice: string | null;
  created_at: string;
}

export interface CreditNote {
  id: string;
  number: string;
  invoice: string;
  invoice_number: string;
  amount: string;
  reason: string;
  issue_date: string;
  created_at: string;
}

export interface InvoicePaymentRow {
  payment_id: string;
  reference: string;
  amount: string;
  paid_at: string | null;
  method: string;
}

export interface InvoiceDetail extends Invoice {
  credit_notes: CreditNote[];
  payments: InvoicePaymentRow[];
}

export interface ReceiptAllocation {
  invoice_number: string;
  description: string;
  period: string;
  amount: string;
}

export interface Receipt {
  id: string;
  number: string;
  payment: string;
  payment_reference: string;
  amount: string;
  tenancy: string | null;
  tenant_name: string;
  issued_at: string;
  snapshot: {
    organization_name: string;
    tenant_name: string;
    unit: string;
    property: string;
    amount: string;
    method: string;
    reference: string;
    paid_at: string;
    allocations: ReceiptAllocation[];
    credit_kept: string;
    balance_after: string;
    credit_after: string;
  };
  sent_sms_at: string | null;
  sent_email_at: string | null;
}

export interface RecurringCharge {
  id: string;
  tenancy: string;
  line_type: ExtraLineType;
  description: string;
  amount: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export type DepositDeductionKind = 'arrears' | 'damages' | 'cleaning' | 'other';

export interface DepositDeduction {
  id?: string;
  kind: DepositDeductionKind;
  description: string;
  amount: string;
}

export type DepositSettlementStatus = 'draft' | 'approved' | 'refunded' | 'cancelled';
export type RefundMethod = 'cash' | 'bank_transfer' | 'mpesa_paybill' | 'other';

export interface DepositSettlement {
  id: string;
  number: string;
  tenancy: string;
  tenant_name: string;
  status: DepositSettlementStatus;
  held_amount: string;
  deductions: DepositDeduction[];
  total_deductions: string;
  refund_amount: string;
  notes: string;
  condition_report: string | null;
  refund_method: RefundMethod | '';
  refund_reference: string;
  refunded_on: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface DepositSummary {
  required: string;
  invoiced: string;
  paid: string;
  outstanding: string;
  held: string;
  to_invoice: string;
  settlements: DepositSettlement[];
}

export interface PenaltyPolicy {
  id: string | null;
  property: string | null;
  enabled: boolean;
  method: 'fixed' | 'percent';
  amount: string;
  percent: string;
  grace_days: number | null;
  frequency: 'once' | 'monthly';
  cap_percent_of_invoice: string | null;
  applies_to: InvoiceType[];
  notify_tenant: boolean;
  updated_at?: string;
}

export type Utility = 'water' | 'electricity';

export interface MeterReading {
  id: string;
  unit: string;
  unit_number: string;
  utility: Utility;
  reading_date: string;
  value: string;
  rate_per_unit: string;
  consumption: string | null;
  billed: boolean;
  billed_invoice: string | null;
  billed_invoice_number: string | null;
  notes: string;
  created_at: string;
}

export type UtilityRates = Partial<Record<Utility, string>>;
