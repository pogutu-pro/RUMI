'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '@/features/auth';
import { getTokenExpiry, getRefreshToken } from '@/lib/auth/token';

const REFRESH_CHECK_INTERVAL = 60 * 1000; // Check every minute
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if expiring in 5 minutes

export function TokenRefresher() {
  const { accessToken, logout, login, user, profile } = useAuthStore();
  const refreshToken = typeof window !== 'undefined' ? getRefreshToken() : null;

  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    const checkAndRefreshToken = async () => {
      try {
        const expiry = getTokenExpiry(accessToken);
        if (!expiry) return;

        const timeUntilExpiry = expiry - Date.now();

        // If token is about to expire (or already expired), refresh it
        if (timeUntilExpiry < REFRESH_THRESHOLD) {
          console.log('Token expiring soon, refreshing...');
          const response = await authApi.refreshToken(refreshToken);
          
          if (response.access_token) {
            const newRefresh = response.refresh_token || refreshToken;
            
            // Update store and cookies
            login({
              user: user!,
              profile: profile || undefined,
              accessToken: response.access_token,
              refreshToken: newRefresh,
            });
            
            console.log('Token refreshed successfully');
          }
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    };

    // Initial check
    checkAndRefreshToken();

    // Periodic check
    const intervalId = setInterval(checkAndRefreshToken, REFRESH_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [accessToken, refreshToken, logout, login, user, profile]);

  return null;
}
