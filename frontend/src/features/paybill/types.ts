/** Mirrors Backend/paybill/serializers.py. */
export interface PaybillAccount {
  id: string;
  shortcode: string;
  shortcode_type: 'paybill' | 'till';
  display_name: string;
  environment: 'sandbox' | 'production';
  is_active: boolean;
  has_credentials: boolean;
  registered_at: string | null;
  last_callback_at: string | null;
  callback_urls: { ConfirmationURL: string; ValidationURL: string };
  created_at: string;
}

export type PaybillTxnStatus = 'matched' | 'unmatched' | 'assigned' | 'ignored';

export interface PaybillTransaction {
  id: string;
  shortcode: string;
  trans_id: string;
  trans_type: string;
  trans_time: string;
  amount: string;
  bill_ref_number: string;
  msisdn: string;
  payer_name: string;
  status: PaybillTxnStatus;
  matched_by: '' | 'reference' | 'unit' | 'phone' | 'manual';
  tenancy: string | null;
  tenant_name: string | null;
  unit_number: string | null;
  payment: string | null;
  receipt_number: string | null;
  note: string;
  resolved_at: string | null;
  received_at: string;
}

export interface PaybillInstruction {
  tenancy: string;
  unit_number: string;
  shortcode: string;
  shortcode_type: 'paybill' | 'till';
  business_name: string;
  account_number: string;
}
