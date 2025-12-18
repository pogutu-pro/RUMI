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
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/lib/auth/token';
import { getApiUrl, isValidApiUrl, logger } from '@/lib/utils/env';
import { getCsrfHeader } from '@/lib/security/csrf';
import type { ApiError, TokenResponse, ApiResponse } from '@/types/api.types';

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

    return config;
  },
  (error) => Promise.reject(error)
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
    const errorMessage = (data as any)?.message || 'An error occurred';

    // 2. Token Refresh Logic (401)
    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        handleLogout();
        return Promise.reject(error);
      }

      try {
        // Use a separate partial instance or fetch to avoid interceptor loops
        const response = await axiosBase.post(
          `${BASE_URL}${REFRESH_PATH}`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access, refresh } = response.data;
        const newAccess = access || response.data?.data?.access;
        const newRefresh = refresh || response.data?.data?.refresh || refreshToken;

        setTokens(newAccess, newRefresh);
        useAuthStore.getState().login({
            accessToken: newAccess,
            refreshToken: newRefresh,
            user: useAuthStore.getState().user! // Keep existing user
        }); // Update store if needed

        processQueue(null, newAccess);
        
        // Update header for the original request
        if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 3. Normalized Error Return
    const apiError: ApiError = {
      error: (data as any)?.error || 'api_error',
      message: errorMessage,
      statusCode: status,
      details: (data as any)?.details || data,
    };

    return Promise.reject(apiError);
  }
);

// -- Helpers --

function handleLogout() {
  clearTokens();
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
     // Optional: Redirect to login or show modal
     // window.location.href = '/login'; 
  }
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
  
  isAuthenticated: () => !!getAccessToken(),
};

export default apiClient;
