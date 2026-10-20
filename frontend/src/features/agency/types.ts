/** Mirrors Backend/agency/views.py serializers and services.OwnerStatementService.compute. */
export interface PropertyOwner {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  kra_pin: string;
  payout_method: 'bank_transfer' | 'mpesa_paybill' | 'cash' | 'other';
  payout_details: string;
  management_fee_percent: string;
  letting_fee_percent: string;
  commission_on_penalties: boolean;
  notes: string;
  is_active: boolean;
  /** What the agency owes the owner; negative = the owner owes (advance outstanding). */
  balance: string;
  property_ids: string[];
  created_at: string;
}

export interface OwnerStatementFigures {
  owner_name: string;
  period_start: string;
  period_end: string;
  management_fee_percent: string;
  letting_fee_percent: string;
  properties: {
    property_id: string;
    property_name: string;
    collected: string;
    deposit_deductions_kept: string;
    expenses: string;
    management_fee: string;
    letting_fee: string;
    new_tenancies: number;
    net: string;
  }[];
  totals: Record<'collected' | 'deposit_deductions_kept' | 'expenses' | 'management_fee' | 'letting_fee' | 'net', string>;
  opening_balance: string;
  remitted: string;
  advanced: string;
  advance_fees: string;
  closing_balance: string;
}

export interface OwnerStatement {
  id: string;
  number: string;
  period_start: string;
  period_end: string;
  net_due: string;
  figures: OwnerStatementFigures;
  approved_at: string;
  emailed_at: string | null;
}

export interface OwnerTransaction {
  id: string;
  kind: 'remittance' | 'advance' | 'advance_fee';
  amount: string;
  transaction_date: string;
  method: string;
  reference: string;
  notes: string;
  created_at: string;
}
