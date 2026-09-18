'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth';
import { hasSessionHint, setUserRole } from '@/lib/auth/token';
import { useAuthStore } from '../stores/auth.store';
import { UserRole, LoginPayload } from '../stores/auth.types';
import {
  LoginRequest,
  ForgotPasswordRequest,
  EmailVerificationRequest,
  PhoneVerificationRequest,
  ResendOtpRequest,
  CaretakerRegisterRequest,
  LandlordRegisterRequest,
  StudentRegisterRequest,
  ResetPasswordRequest,
  AuthResponse,
  ApiError,
} from '@/types/api.types';
import { toast } from 'sonner';

// -- Constants --

const AUTH_REDIRECTS: Record<string, string> = {
  [UserRole.SUPER_ADMIN]: '/platform/billing',
  [UserRole.TECH_SUPPORT_ADMIN]: '/tech-support/dashboard',
  [UserRole.TECH_SUPPORT]: '/tech-support/dashboard',
  [UserRole.LANDLORD]: '/landlord/rental',
  [UserRole.CARETAKER]: '/caretaker/rental',
  [UserRole.STUDENT]: '/tenant/rental',
  [UserRole.TENANT]: '/tenant/rental',
};

const DEFAULT_REDIRECT = '/tenant/rental';

// -- Main Facade Hook --

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);
  const storeSetProfile = useAuthStore((s) => s.setProfile);
  
  const isAuthenticated = status === 'authenticated';
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = React.useCallback(async () => {
    // Must actually call POST /accounts/logout/ before clearing client
    // state: rumi_access_token/rumi_refresh_token are set httponly=True by
    // the backend at login, so clearTokens() (a client-side document.cookie
    // delete inside storeLogout()) can never remove them -- httpOnly cookies
    // are invisible to JS for both read and write. Only the backend's
    // response.delete_cookie() (UserLogoutView) can actually clear them;
    // skipping this call left the stale token cookie valid and visible to
    // middleware.ts's server-side isAuthenticated check even after
    // "logout", while the JS-clearable role/onboarding cookies went empty --
    // that mismatch trapped the user at a blank /onboarding page with no
    // way back to /login. Network failures must never block logout itself,
    // so client state is always cleared regardless of the API call's result.
    try {
      await authApi.logout();
    } catch {
      // Best-effort server-side cookie/token cleanup; proceed with client
      // logout either way so the user is never stuck unable to log out.
    }
    storeLogout();
    queryClient.removeQueries(); // Clear all server state
    queryClient.clear(); // Clear cache
    router.push('/login');
  }, [storeLogout, queryClient, router]);

  const login = React.useCallback((payload: LoginPayload) => {
    storeLogin(payload);
  }, [storeLogin]);

  return { 
    user, 
    profile,
    status, 
    error,
    isAuthenticated, 
    login,
    logout,
    setProfile: storeSetProfile,
    uploadPhoto: async (file: File) => {
        // POST /accounts/profile/picture/ (ProfilePictureUploadView.post)
        // returns a FLAT { message, profile_picture_url } shape — there is
        // no nested `user` key, so a previous implementation that reached
        // into a `.user` sub-object crashed on every real upload.
        const response = await authApi.uploadProfilePicture(file);

        // Update user state with new avatar URL using updateUser
        const updateUser = useAuthStore.getState().updateUser;
        updateUser({
            avatar: response.profile_picture_url,
            profile_picture: response.profile_picture_url
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    updateProfile: async (data: any) => {
         const response = await authApi.updateProfile(data);
         const updateUser = useAuthStore.getState().updateUser;
         updateUser(data); // Optimistic update
         
         queryClient.invalidateQueries({ queryKey: ['profile'] });
         queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    finalizeOnboarding: async () => {
         const response = await authApi.finalizeOnboarding();
         const updateUser = useAuthStore.getState().updateUser;
         updateUser(response.user); // State sync
         
         queryClient.invalidateQueries({ queryKey: ['profile'] });
         queryClient.invalidateQueries({ queryKey: ['user'] });
         return response;
    }
  };
}

// -- Feature Hooks --

/**
 * Shared success handler for login/register
 */
function useAuthSuccess() {
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  return (response: any, successMessage: string) => {
    // 1. Update Store
    const accessToken = response.access || response.access_token;
    const refreshToken = response.refresh || response.refresh_token;

    login({
      user: response.user,
      profile: response.profile || undefined, 
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

    // 2. Set user role cookie for middleware
    if (response.user?.role) {
      setUserRole(response.user.role);
    }

    // 3. Invalidate Queries
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });

    // 4. Final Delegation: Push to dashboard and let Middleware decide if /onboarding is needed
    // This eliminates the conflicting logic in the frontend hooks.
    const redirectUrl = AUTH_REDIRECTS[response.user?.role] || DEFAULT_REDIRECT;
    router.push(redirectUrl as any);

    // 5. Toast
    toast.success(successMessage);
  };
}

/**
 * Hook for user registration
 */
export function useRegister() {
  const handleSuccess = useAuthSuccess();

  return useMutation({
    mutationFn: (
      data:
        | StudentRegisterRequest
        | LandlordRegisterRequest
        | CaretakerRegisterRequest,
    ) => {
      if ('role' in data) {
          switch (data.role) {
            case UserRole.STUDENT:
                return authApi.registerStudent(data as StudentRegisterRequest);
            case UserRole.LANDLORD:
                return authApi.registerLandlord(data as LandlordRegisterRequest);
            case UserRole.CARETAKER:
                return authApi.registerCaretaker(data as CaretakerRegisterRequest);
            default:
                 throw new Error('Invalid role');
          }
      }
      throw new Error('Invalid registration data');
    },
    onSuccess: (response: AuthResponse) => {
      handleSuccess(response, 'Registration successful!');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Registration failed');
    },
  });
}

/**
 * Hook for user login
 */
export function useLogin() {
  const handleSuccess = useAuthSuccess();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response: AuthResponse) => {
      handleSuccess(response, 'Welcome back!');
    },
    onError: (error: ApiError) => {
      // We don't toast here because LoginForm handles it via internal state
      // but we log it for debugging
      console.error('Login error:', error);
    },
  });
}

/**
 * Hook for checking password status
 */
export function useCheckPasswordStatus() {
  return useQuery({
    queryKey: ['passwordStatus'],
    queryFn: () => authApi.checkPasswordStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for setting password for Google users
 */
export function useSetPassword() {
  return useMutation({
    mutationFn: (password: string) => authApi.setPassword(password),
    onSuccess: () => {
      toast.success('Password set successfully! You can now login with email and password.');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to set password. Please try again.';
      toast.error(message);
    },
  });
}

/**
 * Hook for checking email and authentication method
 */
export function useCheckEmail() {
  return useMutation({
    mutationFn: (email: string) => authApi.checkEmail(email),
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to check email. Please try again.';
      toast.error(message);
    },
  });
}

/**
 * Hook for fetching user profile
 */
export function useProfile() {
  const { setProfile, user, status } = useAuth();
  const rehydrate = useAuthStore((s) => s.rehydrate);
  
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response;
    },
    // Must NOT gate on getAccessToken(): rumi_access_token is httponly=True
    // and so invisible to JS, making that check always false after a page
    // load. That left this query permanently disabled on a hard refresh, so
    // nothing ever rehydrated the store out of 'checking' and the dashboard
    // hung on "Loading…". The request itself authenticates via the httpOnly
    // cookie (axios withCredentials: true -> CookieJWTAuthentication).
    enabled: hasSessionHint(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data } = query;

  // Robust Synchronization
  React.useEffect(() => {
    if (!data) return;

    // GET /accounts/profile/ (UserProfileView.get -> FullUserProfileSerializer)
    // returns the user's own fields FLAT at the top level (id/email/role/
    // first_name/...) — there is no `data.user` wrapper. `data.profile` is a
    // separate, role-specific extra that the backend currently only
    // populates for 'student' accounts and is legitimately null for every
    // other role (tenant/landlord/caretaker/tech_support/super_admin), so it
    // must never gate whether we recover the store from 'checking'.
    const flat = data as unknown as {
      id?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      profile_picture?: string;
      role?: UserRole;
      is_verified?: boolean;
    };
    if (!flat.id || !flat.email) return;

    if (status === 'checking' || !user) {
      // Re-hydrate the store if we were checking or lost user state on
      // refresh (hard refresh / new tab / direct nav while JWT is valid).
      rehydrate(
        {
          id: flat.id,
          email: flat.email,
          first_name: flat.first_name ?? '',
          last_name: flat.last_name ?? '',
          role: flat.role as UserRole,
          is_verified: Boolean(flat.is_verified),
          phone_number: flat.phone_number,
          profile_picture: flat.profile_picture,
        },
        data.profile ?? null,
      );
    } else if (data.profile) {
        setProfile(data.profile);
    }
  }, [data, setProfile, user, status, rehydrate]);

  return query;
}

// -- Other Auth Hooks (Cleaned up) --

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    onSuccess: () => {
      toast.success('Password reset instructions sent to your email');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send reset instructions. Please try again.';
      toast.error(message);
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: EmailVerificationRequest) =>
      authApi.verifyEmail(data),
    onSuccess: () => {
      toast.success('Email verified successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Verification failed. Please try again.';
      toast.error(message);
    },
  });
}

export function useVerifyPhone() {
  return useMutation({
    mutationFn: (data: PhoneVerificationRequest) =>
      authApi.verifyPhone(data),
    onSuccess: () => {
      toast.success('Phone verified successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Verification failed. Please try again.';
      toast.error(message);
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (data: ResendOtpRequest) => authApi.resendOtp(data),
    onSuccess: () => {
      toast.success('Verification code sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send verification code');
    },
  });
}

export function useRegisterCaretaker() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CaretakerRegisterRequest) =>
      authApi.registerCaretaker(data),
    onSuccess: () => {
      toast.success(
        'Caretaker registration successful! Please check your email to verify your account.',
      );
      router.push('/login');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to register caretaker');
    },
  });
}

export function useRegisterLandlord() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LandlordRegisterRequest) =>
      authApi.registerLandlord(data),
    onSuccess: () => {
      toast.success(
        'Landlord registration successful! Please check your email to verify your account.',
      );
      router.push('/login');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to register landlord');
    },
  });
}

export function useRegisterStudent() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: StudentRegisterRequest) => authApi.registerStudent(data),
    onSuccess: () => {
      toast.success(
        'Student registration successful! Please check your email to verify your account.',
      );
      router.push('/login');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to register student');
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: () => {
      toast.success(
        'Password reset successful! You can now login with your new password.',
      );
      router.push('/login');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
}

/**
 * Onboarding Hooks
 */
export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => authApi.getOnboardingStatus(),
    staleTime: Infinity, // Or a long duration, but we invalidate it manually
  });
}

export function useSaveOnboardingDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => authApi.saveOnboardingDraft(data),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    }
  });
}

export function useAdvanceOnboardingStage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (nextStage: string) => authApi.advanceOnboardingStage(nextStage),
    onSuccess: (response) => {
       const updateUser = useAuthStore.getState().updateUser;
       updateUser({ onboarding_stage: response.current_stage as any });
       queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    }
  });
}
