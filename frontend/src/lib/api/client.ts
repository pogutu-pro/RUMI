import axiosBase, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import { useAuthStore } from '@/features/auth';
import {
  getAccessToken,
  hasSessionHint,
  setTokens,
  clearTokens,
} from '@/lib/auth/token';
import { getApiUrl, isValidApiUrl, logger } from '@/lib/utils/env';
import { getCsrfHeader } from '@/lib/security/csrf';
import type { ApiError, TokenResponse, ApiResponse } from '@/types/api.types';
import { mapApiError } from './error-mapping';

// -- Configuration --
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const API_URL = getApiUrl();
const REFRESH_PATH = '/accounts/refresh-token/';

if (!isValidApiUrl(API_URL)) {
  console.error(`Invalid API URL: ${API_URL}`);
}

const BASE_URL = USE_MOCK_API
  ? process.env.NEXT_PUBLIC_MOCK_API_URL || '/__mock_api'
  : API_URL;

// -- Types --
interface RequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueueItem {
  resolve: (value: AxiosResponse) => void;
  reject: (error: any) => void;
}

// -- State --
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as any); // The queue logic needs to resolve cleanly
    }
  });
  failedQueue = [];
};

// -- Instance Creation --
export const axiosInstance: AxiosInstance = axiosBase.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// -- Interceptors --

// Request: Attach Token & CSRF
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Attach Bearer token
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Attach CSRF token for mutations
    if (config.method !== 'get' && config.method !== 'head' && config.headers) {
      const csrfHeaders = getCsrfHeader();
      Object.assign(config.headers, csrfHeaders);
    }

    // Debug logging for non-GET requests in development
    if (process.env.NODE_ENV === 'development' && config.method !== 'get') {
      console.groupCollapsed(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('Payload:', config.data);
      console.log('Headers:', config.headers);
      console.groupEnd();
    }

    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response: Error Handling & Refresh Token
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfigWithRetry;

    // 1. Network / No Response Errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          error: 'timeout',
          message: 'Request timed out. Please try again.',
          statusCode: 408,
        });
      }
      return Promise.reject({
        error: 'network_error',
        message: 'Network error. Please check your internet connection.',
        statusCode: 0,
      });
    }

    const { status, data } = error.response;
    
    // Extract the most descriptive error message possible
    const errorMessage = 
      (data as any)?.message || 
      (data as any)?.error || 
      (data as any)?.detail || 
      (Array.isArray((data as any)?.non_field_errors) ? (data as any)?.non_field_errors[0] : (data as any)?.non_field_errors) ||
      'An error occurred';

    // 2. Token Refresh Logic (401)
    // The refresh token lives in an httpOnly cookie that JS cannot read, so
    // the refresh call sends no token: the server reads the cookie, rotates
    // it and sets a fresh access cookie. Sign-in calls are skipped: a 401
    // there is a wrong password, not an expired session.
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthCall(originalRequest.url)) {
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Separate instance so a failing refresh cannot loop through this interceptor.
        const response = await axiosBase.post(
          `${BASE_URL}${REFRESH_PATH}`,
          {},
          { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
        );
        const newAccess: string | undefined = response.data?.access_token;
        if (newAccess) {
          setTokens(newAccess, response.data?.refresh_token);
          const user = useAuthStore.getState().user;
          if (user) useAuthStore.getState().login({ accessToken: newAccess, user });
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        processQueue(null, newAccess ?? null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await endExpiredSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 3. Unified Error Normalization
    const mapped = mapApiError(error);
    
    const apiError: ApiError = {
      error: (data as any)?.error || (data as any)?.code || 'api_error',
      message: mapped.message,
      statusCode: mapped.statusCode,
      details: (data as any)?.details || data,
    };

    // Final "Calm" Polish for Auth
    if (apiError.statusCode === 400 || apiError.statusCode === 401) {
        if (apiError.message === 'An unexpected error occurred. Please try again.' || apiError.message === 'An error occurred') {
            apiError.message = 'The email or password you entered is incorrect. Please try again.';
        }
    }

    return Promise.reject(apiError);
  }
);

// -- Helpers --

const AUTH_CALLS = ['/accounts/login/', '/accounts/auth/', '/accounts/logout/', REFRESH_PATH];

function isAuthCall(url?: string): boolean {
  return !!url && AUTH_CALLS.some((path) => url.includes(path));
}

const SIGNED_OUT_PATHS = ['/login', '/register', '/auth', '/forgot-password', '/reset-password', '/verify-email'];

/**
 * The session is over (the refresh token expired or was revoked). Ask the
 * server to clear its httpOnly cookies, which JS cannot remove, so the site
 * stops treating the browser as signed in; then go to sign-in and come back
 * to this page afterwards. Without this the app kept the dead cookie and
 * pages such as /onboarding stayed blank.
 */
async function endExpiredSession() {
  try {
    await axiosBase.post(`${BASE_URL}/accounts/logout/`, {}, { withCredentials: true });
  } catch {
    // Best effort: still clear the client side and leave.
  }
  clearTokens();
  useAuthStore.getState().logout();
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  const onSignedOutPage =
    pathname === '/' || SIGNED_OUT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (onSignedOutPage) return;
  window.location.href = `/login?session_expired=true&next=${encodeURIComponent(pathname + search)}`;
}

export async function requestWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Don't retry client errors (4xx) except 429 (Too Many Requests) or 408 (Timeout)
      if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500 && err.statusCode !== 429 && err.statusCode !== 408) {
        throw err;
      }
      
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export const apiClient = {
  axios: axiosInstance,
  get: axiosInstance.get,
  post: axiosInstance.post,
  put: axiosInstance.put,
  delete: axiosInstance.delete,
  patch: axiosInstance.patch,
  
  // hasSessionHint(), not getAccessToken(): the access-token cookie is
  // httponly=True and invisible to JS, so getAccessToken() is always null
  // after a page load and this would report "logged out" mid-session.
  isAuthenticated: () => hasSessionHint(),
};

export default apiClient;
