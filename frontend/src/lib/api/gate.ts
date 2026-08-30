import { AxiosError } from 'axios';

/**
 * Canonical D-10 gate-rejection contract (see 03-CONTEXT.md).
 * A blocked request returns HTTP 403 with a body matching this shape.
 */
export interface GateRejection {
  detail: string;
  gate: 'max_properties' | 'max_units' | 'max_caretaker_seats' | 'analytics';
  current_tier: string;
  required_tier: string;
}

/** Closed enum of valid `gate` values — used to validate untrusted response bodies. */
export const GATE_KEYS = [
  'max_properties',
  'max_units',
  'max_caretaker_seats',
  'analytics',
] as const;

/**
 * Detects a gate-rejection 403 (D-10 contract) and returns the parsed body,
 * or `null` for anything else — a plain error, a non-403, a 403 with no
 * `gate` key, or a 403 whose `gate` value isn't one of the fixed GATE_KEYS.
 *
 * This is UX-only detection. It never grants access — the backend
 * (plan 03-01's GatingService) remains the sole security boundary.
 */
export function isGateRejection(error: unknown): GateRejection | null {
  if (!(error instanceof AxiosError)) return null;
  if (error.response?.status !== 403) return null;

  const data = error.response.data;
  if (!data || typeof data !== 'object') return null;

  const gate = (data as Record<string, unknown>).gate;
  if (typeof gate !== 'string') return null;
  if (!(GATE_KEYS as readonly string[]).includes(gate)) return null;

  return data as GateRejection;
}

/** 'starter' -> 'Starter', 'pro' -> 'Pro', 'enterprise' -> 'Enterprise'. */
export function capitalizeTier(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** Gate-specific banner title — matches 03-UI-SPEC.md's Copywriting Contract. */
export function gateBannerTitle(gate: GateRejection): string {
  switch (gate.gate) {
    case 'max_properties':
      return 'Property limit reached';
    case 'max_units':
      return 'Unit limit reached';
    case 'max_caretaker_seats':
      return 'Caretaker seat limit reached';
    case 'analytics':
      return `Analytics is a ${capitalizeTier(gate.required_tier)} feature`;
    default:
      return 'Feature limit reached';
  }
}
