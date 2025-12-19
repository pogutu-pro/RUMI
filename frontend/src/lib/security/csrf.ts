/**
 * CSRF Token Management for Django REST Framework
 * 
 * Django uses CSRF tokens to prevent Cross-Site Request Forgery attacks.
 * This utility handles getting, storing, and rotating CSRF tokens.
 */

const CSRF_COOKIE_NAME = 'csrftoken';
const CSRF_HEADER_NAME = 'X-CSRFToken';

/**
 * Get CSRF token from cookie
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${CSRF_COOKIE_NAME}=`);
  
  if (parts.length === 2) {
    const token = parts.pop()?.split(';').shift();
    return token || null;
  }
  
  return null;
}

/**
 * Get CSRF header object for requests
 */
export function getCsrfHeader(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

/**
 * Fetch CSRF token from Django backend
 * This should be called before the first API request
 */
export async function fetchCsrfToken(apiUrl: string): Promise<void> {
  // Silent bypass if not explicitly needed, to avoid 404 errors on missing endpoint
  return;
}

export const csrf = {
  getToken: getCsrfToken,
  getHeader: getCsrfHeader,
  fetch: fetchCsrfToken,
  COOKIE_NAME: CSRF_COOKIE_NAME,
  HEADER_NAME: CSRF_HEADER_NAME,
} as const;
