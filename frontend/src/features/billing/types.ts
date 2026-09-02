/**
 * RumiaRent billing-plan domain types — mirror Backend/billing/serializers.py
 * SubscriptionPlanSerializer exactly. Deliberately excludes the Paystack
 * plan-code field, matching the serializer's public-safe field list.
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  /** DecimalField serializes as string in DRF — PriceDisplay already handles `number | string`. */
  price: string;
  interval: string;
  max_properties: number;
  max_units: number;
  max_caretaker_seats: number;
  features: Record<string, boolean>;
}

/**
 * RumiaRent organization-subscription domain type — mirrors
 * Backend/billing/serializers.py OrganizationSubscriptionSerializer exactly.
 * Deliberately excludes all `paystack_*` code/token fields, matching the
 * serializer's public-safe field list.
 */
export interface OrganizationSubscription {
  id: string;
  plan: string;
  plan_details: SubscriptionPlan;
  status: 'pending' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  billing_mode: 'auto' | 'manual';
  current_period_start: string | null;
  current_period_end: string | null;
  grace_period_ends_at: string | null;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
}
