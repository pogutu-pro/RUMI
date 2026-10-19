/** Mirrors Backend/accounting (views.ExpenseSerializer, services.StatementService.as_dict). */
export type ExpenseCategory =
  | 'repairs' | 'utilities' | 'security_cleaning' | 'management_fees' | 'insurance' | 'rates_taxes' | 'other';

export interface Expense {
  id: string;
  property: string | null;
  property_name: string;
  unit: string | null;
  category: ExpenseCategory;
  category_label: string;
  description: string;
  supplier: string;
  amount: string;
  expense_date: string;
  paid_from: 'cash' | 'bank_transfer' | 'mpesa_paybill' | 'other';
  reference: string;
  voided_at: string | null;
  void_reason: string;
  created_at: string;
}

export interface StatementTenantRow {
  tenancy_id: string;
  tenant_name: string;
  unit_number: string;
  property_name: string;
  opening: string;
  invoiced: string;
  credited: string;
  paid: string;
  paid_from_deposit: string;
  reversed: string;
  closing: string;
}

export interface Statement {
  organization_name: string;
  property_name: string;
  period_start: string;
  period_end: string;
  cash: {
    received_by_channel: Record<string, string>;
    received_total: string;
    deposits_refunded: string;
    expenses_total: string;
    net_cash: string;
  };
  income_by_type: Record<string, string>;
  waivers: string;
  expenses_by_category: Record<string, string>;
  owed_opening: string;
  owed_closing: string;
  deposits_held_closing: string;
  tenants: StatementTenantRow[];
  expenses: { id: string; date: string; category: string; description: string; supplier: string; amount: string; property: string }[];
}
