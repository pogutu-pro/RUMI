import * as React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { authApi } from '@/features/auth/api/auth';

jest.mock('@/features/auth/api/auth', () => ({
  authApi: {
    uploadProfilePicture: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockedUploadProfilePicture = authApi.uploadProfilePicture as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * `POST /accounts/profile/picture/` (ProfilePictureUploadView.post,
 * Backend/accounts/views.py ~line 943) returns a FLAT
 * `{ message, profile_picture_url }` shape — there is no `.user` key.
 * Before the fix, `useAuth().uploadPhoto` read `response.user.profile_picture`,
 * which throws `Cannot read properties of undefined (reading 'profile_picture')`
 * on every real upload since `response.user` is always undefined.
 */
describe('useAuth().uploadPhoto — flat response shape', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      status: 'authenticated',
      user: {
        id: 'user-1',
        email: 'tenant@example.com',
        first_name: 'Tee',
        last_name: 'Nant',
        role: 'tenant' as never,
        is_verified: true,
      },
      profile: null,
      accessToken: 'fake-jwt',
      error: null,
    });
  });

  it('reads response.profile_picture_url and updates the store without throwing', async () => {
    mockedUploadProfilePicture.mockResolvedValue({
      message: 'Profile picture uploaded successfully',
      profile_picture_url: 'https://cdn.example.com/profiles/abc.jpg',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    await waitFor(() => {
      expect(useAuthStore.getState().user?.profile_picture).toBe(
        'https://cdn.example.com/profiles/abc.jpg',
      );
    });
    expect(useAuthStore.getState().user?.avatar).toBe(
      'https://cdn.example.com/profiles/abc.jpg',
    );
  });
});
