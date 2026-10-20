import * as React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useProfile } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { authApi } from '@/features/auth/api/auth';

jest.mock('@/features/auth/api/auth', () => ({
  authApi: {
    getProfile: jest.fn(),
  },
}));

// react-router/navigation hooks used by other exports in use-auth.ts
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockedGetProfile = authApi.getProfile as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Regression for debug session `tenant-dashboard-stuck-loading`.
 *
 * GET /accounts/profile/ (UserProfileView -> FullUserProfileSerializer)
 * returns the user's own fields FLAT at the top level — there is no
 * `data.user` wrapper — and `data.profile` is null for every role except
 * 'student' (FullUserProfileSerializer.get_profile). Before the fix,
 * useProfile()'s rehydration effect required BOTH `data.profile` AND
 * `data.user` to be truthy before calling `rehydrate()`, so a tenant (or
 * landlord/caretaker/tech_support/super_admin) whose store was stuck at
 * `status: 'checking'` (the hard-refresh / new-tab / direct-nav persist
 * race) could never recover — the dashboard's "Loading..." guard
 * (`status === 'checking' || ...`) never cleared.
 */
describe('useProfile — recovering a store stuck at "checking"', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The JWT cookies are httpOnly in production, so useProfile keys off the
    // JS-readable role cookie (hasSessionHint) to decide whether to fetch.
    document.cookie = 'rumi_user_role=tenant; Path=/;';
    useAuthStore.setState({
      status: 'checking',
      user: null,
      profile: null,
      accessToken: null,
      error: null,
    });
  });

  afterEach(() => {
    document.cookie = 'rumi_user_role=; Max-Age=0; Path=/;';
  });

  it('rehydrates to "authenticated" from a flat response with a null profile (tenant role)', async () => {
    mockedGetProfile.mockResolvedValue({
      id: 'user-123',
      email: 'tenant@example.com',
      first_name: 'Tee',
      last_name: 'Nant',
      role: 'tenant',
      phone_number: '+254700000000',
      profile: null, // FullUserProfileSerializer.get_profile() for non-student roles
    });

    renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe('authenticated');
    });

    expect(useAuthStore.getState().user).toMatchObject({
      id: 'user-123',
      email: 'tenant@example.com',
      role: 'tenant',
    });
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('rehydrates to "authenticated" for a landlord too (null profile is not student-only)', async () => {
    mockedGetProfile.mockResolvedValue({
      id: 'user-456',
      email: 'landlord@example.com',
      first_name: 'Lan',
      last_name: 'Dlord',
      role: 'landlord',
      profile: null,
    });

    renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe('authenticated');
    });
    expect(useAuthStore.getState().user?.role).toBe('landlord');
  });

  it('does not rehydrate when the response is missing core identity fields (boundary: no id/email)', async () => {
    mockedGetProfile.mockResolvedValue({ profile: null } as never);

    renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(mockedGetProfile).toHaveBeenCalled());
    // Give the effect a chance to (not) run.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(useAuthStore.getState().status).toBe('checking');
    expect(useAuthStore.getState().user).toBeNull();
  });
});
