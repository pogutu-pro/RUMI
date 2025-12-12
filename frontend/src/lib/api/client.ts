import axiosBase, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

import { useAuthStore } from '@/features/auth';

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/lib/auth/token';

import { getApiUrl, isValidApiUrl, logger } from '@/lib/utils/env';
import type { ApiError, TokenResponse, ApiResponse } from '@/types/api.types';

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const API_URL = getApiUrl();
// Ensure we use the correct backend path for token refresh
const REFRESH_PATH = '/accounts/refresh-token/';

if (!isValidApiUrl(API_URL)) {
  throw new Error(`Invalid API URL: ${API_URL}`);
}

logger?.info?.(
  `Initializing API client with base URL: ${API_URL} (mock=${USE_MOCK_API})`,
);

// Base URL should already include /api/v1 from env or fallback
const BASE_URL = USE_MOCK_API
  ? process.env.NEXT_PUBLIC_MOCK_API_URL || '/__mock_api'
  : API_URL;

export const axiosInstance: AxiosInstance = axiosBase.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const refreshClient: AxiosInstance = axiosBase.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// --------------------------------------------------
// Types
// --------------------------------------------------
type RequestConfigWithRetry = AxiosRequestConfig & { _retry?: boolean };

type QueueItem = {
  resolve: (value: Promise<AxiosResponse<any>>) => void;
  reject: (error?: any) => void;
  originalRequest: RequestConfigWithRetry;
};

// --------------------------------------------------
// Refresh Queue
// --------------------------------------------------
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const enqueueRequest = (item: QueueItem) => {
  failedQueue.push(item);
};

const processQueue = (error: any | null, accessToken: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, originalRequest }) => {
    if (error) {
      reject(error);
      return;
    }

    const retryConfig: RequestConfigWithRetry = {
      ...originalRequest,
      headers: {
        ...(originalRequest.headers || {}),
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      } as any,
    };

    resolve(axiosInstance.request(retryConfig));
  });

  failedQueue = [];
};

const safeGetRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return getRefreshToken() ?? null;
  } catch {
    return null;
  }
};

// --------------------------------------------------
// Request Interceptor (Merged Logic)
// --------------------------------------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? getAccessToken() : null;

    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      } as any;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// --------------------------------------------------
// Response Interceptor (Merged Refresh Logic)
// --------------------------------------------------
axiosInstance.interceptors.response.use(
  (resp: AxiosResponse) => resp,

  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfigWithRetry | undefined;

    // If config is missing, just reject
    if (!originalRequest) return Promise.reject(error);

    // Network error (no response)
    if (!error.response) {
      const networkErr: ApiError = {
        error: 'network_error',
        message: 'Network error. Please check your internet connection.',
        statusCode: 0,
      };
      return Promise.reject(networkErr);
    }

    const status = error.response.status;

    // --------------------------------------------------
    // 401 - Token refresh handling (merge of both clients)
    // --------------------------------------------------
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          enqueueRequest({ resolve, reject, originalRequest });
        });
      }

      isRefreshing = true;

      const refreshToken = safeGetRefreshToken();

      if (!refreshToken) {
        clearTokens();
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const refreshUrl = `${BASE_URL.replace(/\/$/, '')}${
          REFRESH_PATH.startsWith('/') ? '' : '/'
        }${REFRESH_PATH}`;

        const resp = await refreshClient.post<
          TokenResponse | ApiResponse<{ access: string }>
        >(refreshUrl, { refresh: refreshToken }, { withCredentials: true });

        const raw = resp.data as any;
        const access = raw?.access ?? raw?.data?.access ?? getAccessToken();
        const newRefresh = raw?.refresh ?? raw?.data?.refresh ?? refreshToken;

        setTokens(access, newRefresh);
        useAuthStore.setState({
          accessToken: access,
          refreshToken: newRefresh,
        });

        processQueue(null, access);

        const retryConfig: RequestConfigWithRetry = {
          ...originalRequest,
          headers: {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${access}`,
          } as any,
        };

        return axiosInstance.request(retryConfig);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearTokens();
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // --------------------------------------------------
    // 403 - Forbidden
    // --------------------------------------------------
    if (status === 403) {
      // DON'T automatically logout on 403
      // 403 means "authenticated but not authorized" - user is logged in but lacks permission
      // Only logout on 401 (not authenticated) or failed token refresh
      const forbiddenErr: ApiError = {
        error: 'forbidden',
        message: (error.response.data as any)?.message || 'Access forbidden.',
        statusCode: 403,
        details: error.response.data,
      };
      return Promise.reject(forbiddenErr);
    }

    // --------------------------------------------------
    // 5xx - Server errors
    // --------------------------------------------------
    if (status >= 500) {
      const serverErr: ApiError = {
        error: 'server_error',
        message:
          (error.response.data as any)?.message ||
          'Server error. Please try again later.',
        statusCode: status,
        details: error.response.data,
      };
      return Promise.reject(serverErr);
    }

    // --------------------------------------------------
    // 4xx - Client errors
    // --------------------------------------------------
    if (status >= 400 && status < 500) {
      const clientErr: ApiError = {
        error: (error.response.data as any)?.error || 'client_error',
        message: (error.response.data as any)?.message || 'Request failed.',
        statusCode: status,
        details: error.response.data,
      };
      return Promise.reject(clientErr);
    }

    return Promise.reject(error);
  },
);

// --------------------------------------------------
// Retry Wrapper
// --------------------------------------------------
export async function requestWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 500,
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (axiosBase.isAxiosError(err) && err.response) {
        const s = err.response.status;
        if (s >= 400 && s < 500 && s !== 429) throw err;
      }

      if (attempt < maxRetries) {
        const delayMs = baseDelayMs * (attempt + 1);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  throw lastError;
}

// --------------------------------------------------
// Public API Client Object
// --------------------------------------------------
export const apiClient = {
  axios: axiosInstance,

  isApiError: (err: any): err is ApiError =>
    !!err && typeof err === 'object' && 'error' in err && 'statusCode' in err,

  getErrorMessage: (err: any): string => {
    if (apiClient.isApiError(err)) return err.message;
    if (err instanceof Error) return err.message;
    if (axiosBase.isAxiosError(err) && err.response?.data?.message)
      return String(err.response.data.message);
    return 'An unexpected error occurred';
  },

  isAuthenticated: (): boolean =>
    typeof window !== 'undefined' ? !!getAccessToken() : false,

  clearAuth: () => {
    clearTokens();
    useAuthStore.getState().logout();
  },

  requestWithRetry,
} as const;

export default apiClient;
