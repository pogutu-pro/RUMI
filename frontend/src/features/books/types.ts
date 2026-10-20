/** Mirrors Backend/accounting (books.StatementService.as_dict, books_views, reports). */
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

export interface StatementLine {
  id: string;
  line_date: string;
  reference: string;
  description: string;
  amount: string;
  status: 'matched' | 'created' | 'unmatched' | 'ignored';
  payment: string | null;
  payment_reference: string | null;
  tenant_name: string | null;
  note: string;
}

export interface ReportRow { code: string; name: string; amount?: string; debit?: string; credit?: string; type?: string }
