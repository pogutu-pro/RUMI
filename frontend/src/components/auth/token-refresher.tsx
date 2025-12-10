'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth';
import { getTokenExpiry, isTokenExpired } from '@/lib/auth/token';

const REFRESH_CHECK_INTERVAL = 60 * 1000; // Check every minute
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if expiring in 5 minutes

export function TokenRefresher() {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore();

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
          
          if (response.access) {
            const newRefresh = response.refresh || refreshToken;
            setTokens(response.access, newRefresh);
            // Update store as well
            useAuthStore.setState({
              accessToken: response.access,
              refreshToken: newRefresh,
            });
            console.log('Token refreshed successfully');
          }
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // If refresh fails with 401/403, it usually means refresh token is invalid
        // The axios interceptor might handle this, but we can also handle it here
        // However, we shouldn't aggressively logout here to avoid disrupting the user
        // unless we are sure. Let the interceptor handle the logout on next API call.
      }
    };

    // Initial check
    checkAndRefreshToken();

    // Periodic check
    const intervalId = setInterval(checkAndRefreshToken, REFRESH_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [accessToken, refreshToken, setTokens]);

  return null;
}
