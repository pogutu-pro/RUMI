import type { SubscriptionPlan } from './types';

/** "features: { analytics: true }" -> "Analytics". Shared by the pricing
 * page and the onboarding wizard so a plan reads the same wherever it's shown. */
function formatFeatureKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatLimit(count: number, singular: string, plural: string): string {
  if (count === 0) return `Unlimited ${plural}`;
  return `${count} ${count === 1 ? singular : plural}`;
}

/** The bullet points under a plan's price: its limits, then any enabled feature flags. */
export function planFeatures(plan: SubscriptionPlan): string[] {
  const featureFlags = Object.entries(plan.features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => formatFeatureKey(key));

  return [
    formatLimit(plan.max_properties, 'property', 'properties'),
    formatLimit(plan.max_units, 'unit', 'units'),
    formatLimit(plan.max_caretaker_seats, 'caretaker seat', 'caretaker seats'),
    ...featureFlags,
  ];
}

/** The plan every "which one's recommended" badge points at. */
export const RECOMMENDED_PLAN_SLUG = 'pro';
