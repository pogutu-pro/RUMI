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
