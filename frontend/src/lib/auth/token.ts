import { Buffer } from 'buffer';

const ACCESS_TOKEN_COOKIE = 'rumi_access_token';
const REFRESH_TOKEN_COOKIE = 'rumi_refresh_token';
const ROLE_COOKIE = 'rumi_user_role';
const ONBOARDING_STAGE_COOKIE = 'rumi_onboarding_stage';

const ACCESS_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const isBrowser = () => typeof document !== 'undefined';

const encode = (value: string) => encodeURIComponent(value);

function setCookie(name: string, value: string, maxAge: number) {
  if (!isBrowser()) return;
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? ' Secure'
      : '';
  document.cookie = `${name}=${encode(value)}; Max-Age=${maxAge}; Path=/; SameSite=Strict;${secure}`;
}

function deleteCookie(name: string) {
  if (!isBrowser()) return;
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? ' Secure'
      : '';
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict;${secure}`;
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=')[1] ?? '');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_MAX_AGE);
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_MAX_AGE);
}

export function getAccessToken(): string | null {
  return readCookie(ACCESS_TOKEN_COOKIE);
}

/**
 * Whether a session appears to exist, from the browser's point of view.
 *
 * `getAccessToken()` CANNOT be used for this. The backend sets
 * rumi_access_token with httponly=True (UserLoginView in
 * Backend/accounts/views.py), and an httpOnly cookie is invisible to
 * JavaScript for both read and write — `document.cookie` never contains it,
 * so getAccessToken() always returns null after any page load, even while a
 * perfectly valid session is in flight. Gating hydration or query-enablement
 * on it makes a hard refresh look logged-out to the client while the
 * server-side middleware still sees the cookie and considers the user logged
 * in — the two disagree and the app deadlocks on a "Loading…" screen.
 *
 * rumi_user_role is the right signal: it is deliberately set httponly=False
 * ("Frontend needs access to role"), written on every login by both the
 * backend and setUserRole(), and cleared on logout by both clearTokens() and
 * the backend's delete_cookie(). It is a hint only — the server remains the
 * authority, and the actual auth for API calls rides the httpOnly cookie via
 * axios `withCredentials: true`.
 */
export function hasSessionHint(): boolean {
  return readCookie(ROLE_COOKIE) !== null;
}

export function getRefreshToken(): string | null {
  return readCookie(REFRESH_TOKEN_COOKIE);
}

export function clearTokens(): void {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
  deleteCookie(ROLE_COOKIE);
  deleteCookie(ONBOARDING_STAGE_COOKIE);
}

export function setUserRole(role: string): void {
  setCookie(ROLE_COOKIE, role, REFRESH_MAX_AGE);
}

export function getUserRoleFromCookie(): string | null {
  return readCookie(ROLE_COOKIE);
}

export function setOnboardingStage(stage: string): void {
  setCookie(ONBOARDING_STAGE_COOKIE, stage, REFRESH_MAX_AGE);
}

export function getOnboardingStage(): string | null {
  return readCookie(ONBOARDING_STAGE_COOKIE);
}

const decodeBase64 = (input: string) => {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(input);
  }
  return Buffer.from(input, 'base64').toString('binary');
};

export function decodeToken<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = decodeBase64(padded);
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

export function getTokenExpiry(token?: string | null): number | null {
  const jwt = token ?? getAccessToken();
  if (!jwt) return null;
  const payload = decodeToken<{ exp?: number }>(jwt);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function isTokenExpired(bufferMs = 5 * 60 * 1000): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() + bufferMs >= expiry;
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired();
}

export function getAuthStatus() {
  const token = getAccessToken();
  const expiry = getTokenExpiry(token);
  const isExpired = expiry ? Date.now() >= expiry : true;
  return {
    isAuthenticated: !!token && !isExpired,
    hasToken: !!token,
    isExpired,
    timeUntilExpiry: expiry ? Math.max(0, expiry - Date.now()) : null,
  };
}

export function getUserFromToken<T = Record<string, unknown>>(): T | null {
  const token = getAccessToken();
  if (!token) return null;
  return decodeToken<T>(token);
}
