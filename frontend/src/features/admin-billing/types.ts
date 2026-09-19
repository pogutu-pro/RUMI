/**
 * RumiaRent super-admin billing domain types — mirror
 * Backend/billing/serializers.py's AdminOrganizationBillingListSerializer
 * and AdminOrganizationBillingDetailSerializer field-for-field (06-03).
 */
import type { OrganizationSubscription, SubscriptionPlan } from '@/features/billing/types';

/** Mirrors AdminRevenueSummaryView's response (Backend/billing/views.py) —
 * real numbers from the SubscriptionPayment ledger, never estimated. */
export interface AdminRevenueSummary {
  total_revenue: string;
  revenue_this_month: string;
  mrr: string;
  active_subscriptions_count: number;
  total_successful_payments: number;
  monthly_revenue: { month: string; total: string }[];
}

/** Mirrors AdminPlatformOverviewView's response (Backend/billing/views.py) —
 * the single-call snapshot behind the super-admin Overview page. */
export interface AdminPlatformOverview {
  total_users: number;
  users_by_role: Record<string, number>;
  total_organizations: number;
  total_revenue: string;
  revenue_this_month: string;
  mrr: string;
  paying_organizations: number;
  open_support_tickets: number;
  total_support_tickets: number;
}

/** Flat summary row for the super-admin organization list (ADMIN-01/ADMIN-02). */
export interface AdminBillingListRow {
  id: string;
  name: string;
  slug: string;
  subscription_status: string | null;
  plan_name: string | null;
  plan_slug: string | null;
  payout_status: string;
}

/** Mirrors rumia_api's OrganizationSerializer field list (id/name/slug/type/status/timestamps). */
export interface AdminBillingOrganization {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Mirrors organizations' PayoutAccountSerializer — bank details already masked server-side. */
export interface AdminBillingPayout {
  status: string;
  account_name: string;
  bank_name: string;
  bank_account_number_masked: string;
  last_verified_at: string | null;
  updated_at: string;
}

/** Mirrors billing's SubscriptionPaymentSerializer — the "last charge event" (ADMIN-02, D-06). */
export interface AdminBillingChargeEvent {
  id: string;
  amount: string;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  paystack_reference: string;
  initiated_at: string;
  paid_at: string | null;
  failed_at: string | null;
  failure_reason: string;
}

/**
 * Mirrors AdminOrganizationBillingDetailSerializer exactly — shared shape
 * for both the GET detail fetch and the POST-override response, so a
 * post-override refresh never drifts from a plain detail fetch.
 */
export interface AdminBillingDetail {
  organization: AdminBillingOrganization;
  subscription: OrganizationSubscription | null;
  effective_plan: SubscriptionPlan;
  payout: AdminBillingPayout | null;
  last_charge_event: AdminBillingChargeEvent | null;
}

/** Request body for POST /billing/admin/organizations/{id}/override/ — an explicit allow-list. */
export interface AdminOverridePayload {
  plan_id?: string;
  status?: string;
  reason: string;
}

/** Mirrors Backend billing AdminPlanSerializer. */
export interface AdminPlan {
  id: string;
  name: string;
  slug: 'starter' | 'pro' | 'enterprise' | string;
  price: string;
  interval: string;
  /** 0 means unlimited for each of the three limits. */
  max_properties: number;
  max_units: number;
  max_caretaker_seats: number;
  features: { analytics?: boolean; branded_receipts?: boolean };
  sort_order: number;
  paystack_linked: boolean;
  active_subscribers: number;
  updated_at: string;
}

export interface AdminPlanUpdate {
  name?: string;
  price?: number | string;
  max_properties?: number;
  max_units?: number;
  max_caretaker_seats?: number;
  features?: { analytics?: boolean; branded_receipts?: boolean };
}

export interface AdminPlanUpdateResult extends AdminPlan {
  paystack_sync: { status: 'updated' | 'skipped' | 'failed' | 'not_needed'; detail?: string };
}
