/** Mirrors Backend/accounting/services.py and views.py. Money arrives as decimal strings. */
export type MriStatus = 'filed' | 'in_progress' | 'due' | 'overdue';
export type MriBand = 'below' | 'within' | 'above';

export interface MriProperty {
  property_id: string | null;
  property_name: string;
  amount: string;
  payments: number;
  mri: string;
}

export interface MriMonth {
  month: string; // 2026-09-01
  gross_rent: string;
  payments: number;
  rate: string;
  mri_due: string;
  is_nil: boolean;
  by_property: MriProperty[];
  deadline: string;
  status: MriStatus;
  rolling_12_months: string;
  band: MriBand;
  annual_min: string;
  annual_max: string;
  filing: null | {
    filed_on: string;
    reference: string;
    gross_rent_at_filing: string;
    mri_at_filing: string;
    changed_since: boolean;
  };
}

export interface MriYear {
  year: number;
  months: MriMonth[];
  total_gross_rent: string;
  total_mri_due: string;
}

export interface TaxProfile {
  kra_pin: string;
  mri_rate: string;
  annual_min: string;
  annual_max: string;
  filing_due_day: number;
}

export interface Summary {
  start: string;
  end: string;
  income: string;
  expenses: string;
  net: string;
  expenses_by_category: { category: string; label: string; amount: string }[];
  by_property: { property_id: string | null; property_name: string; income: string; expenses: string; net: string }[];
}

export type ExpenseCategory =
  | 'repairs' | 'utilities' | 'caretaker' | 'security' | 'cleaning' | 'insurance' | 'land_rates' | 'agent_fees' | 'other';

export interface Expense {
  id: string;
  property: string | null;
  property_name: string;
  category: ExpenseCategory;
  category_label: string;
  amount: string;
  incurred_on: string;
  vendor: string;
  description: string;
  paid_from: ExpensePaidFrom;
  reference: string;
  receipt_url: string | null;
  is_void: boolean;
  void_reason: string;
}

export type ExpensePaidFrom = 'cash' | 'bank_transfer' | 'mpesa_paybill' | 'other';

/** Which account the money left; the ledger credits it so cash, bank and M-Pesa balances stay right. */
export const EXPENSE_PAID_FROM: { value: ExpensePaidFrom; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank' },
  { value: 'mpesa_paybill', label: 'M-Pesa' },
  { value: 'other', label: 'Other' },
];

export interface ExpenseInput {
  amount: string;
  category: ExpenseCategory;
  paid_from: ExpensePaidFrom;
  incurred_on: string;
  property: string;
  vendor: string;
  description: string;
  receipt?: File | null;
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'repairs', label: 'Repairs and maintenance' },
  { value: 'utilities', label: 'Utilities (water, power)' },
  { value: 'caretaker', label: 'Caretaker pay' },
  { value: 'security', label: 'Security' },
  { value: 'cleaning', label: 'Cleaning and garbage' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'land_rates', label: 'Land rates and permits' },
  { value: 'agent_fees', label: 'Agent or management fees' },
  { value: 'other', label: 'Other' },
];

export type ExportKind = 'ledger' | 'quickbooks_bank' | 'quickbooks_journal' | 'mri';
