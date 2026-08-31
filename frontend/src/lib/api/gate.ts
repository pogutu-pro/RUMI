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
 * Reads the HTTP status off either a raw `AxiosError` (used directly by
 * tests, or by callers that bypass the shared client) or the normalized
 * `ApiError` shape (`{ statusCode, details }`) that
 * `frontend/src/lib/api/client.ts`'s response interceptor rejects with for
 * every request made through `axiosInstance` in production.
 */
function extractStatus(error: unknown): number | undefined {
  if (error instanceof AxiosError) return error.response?.status;
  return (error as { statusCode?: number } | undefined)?.statusCode;
}

/** Mirrors {@link extractStatus} for the response body / normalized `details`. */
function extractResponseData(error: unknown): unknown {
  if (error instanceof AxiosError) return error.response?.data;
  return (error as { details?: unknown } | undefined)?.details;
}

/**
 * Detects a gate-rejection 403 (D-10 contract) and returns the parsed body,
 * or `null` for anything else — a plain error, a non-403, a 403 with no
 * `gate` key, or a 403 whose `gate` value isn't one of the fixed GATE_KEYS.
 *
 * Accepts both a raw `AxiosError` and the normalized `ApiError` shape
 * produced by `client.ts`'s response interceptor (`statusCode` + `details`)
 * — real traffic through `axiosInstance` only ever reaches callers in the
 * latter shape, so matching only `AxiosError` here would never fire (see
 * CR-01 in 03-REVIEW.md).
 *
 * This is UX-only detection. It never grants access — the backend
 * (plan 03-01's GatingService) remains the sole security boundary.
 */
export function isGateRejection(error: unknown): GateRejection | null {
  if (extractStatus(error) !== 403) return null;

  const data = extractResponseData(error);
  if (!data || typeof data !== 'object') return null;

  const body = data as Record<string, unknown>;
  const gate = body.gate;
  if (typeof gate !== 'string') return null;
  if (!(GATE_KEYS as readonly string[]).includes(gate)) return null;

  // WR-06: validate the rest of the D-10 contract too, not just `gate` —
  // gateBannerTitle()/GateBanner call capitalizeTier(gate.required_tier),
  // which does `slug.charAt(0)` and would throw a TypeError inside render
  // for a malformed/regressed response body.
  if (
    typeof body.detail !== 'string' ||
    typeof body.current_tier !== 'string' ||
    typeof body.required_tier !== 'string'
  ) {
    return null;
  }

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
