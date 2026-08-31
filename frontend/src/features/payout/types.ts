/**
 * RumiaRent payout domain types — mirror Backend/organizations/serializers.py
 * exactly. PayoutAccountStatus never includes a raw `bank_account_number` or
 * `bank_code`/`paystack_subaccount_code` field (T-04-06) — only the
 * server-computed masked account number, matching PayoutAccountSerializer's
 * deliberate field exclusion.
 */

export type PayoutStatus = 'not_started' | 'pending_verification' | 'active';

export interface PayoutAccountStatus {
  status: PayoutStatus;
  account_name: string;
  bank_name: string;
  bank_account_number_masked: string;
  last_verified_at: string | null;
  updated_at: string | null;
}

export interface SubmitPayoutDetailsPayload {
  bank_name: string;
  bank_account_number: string;
  bank_code: string;
}
