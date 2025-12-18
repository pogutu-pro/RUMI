'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth';
import { getAccessToken, setUserRole } from '@/lib/auth/token';
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
  [UserRole.SUPER_ADMIN]: '/admin/dashboard',
  [UserRole.TECH_SUPPORT_ADMIN]: '/tech-support/dashboard',
  [UserRole.TECH_SUPPORT]: '/tech-support/dashboard',
  [UserRole.LANDLORD]: '/landlord/dashboard',
  [UserRole.CARETAKER]: '/caretaker/dashboard',
  [UserRole.STUDENT]: '/student/dashboard',
};

const DEFAULT_REDIRECT = '/student/dashboard';

// -- Helper Hook --

function useAuthRedirect() {
  const router = useRouter();

  const redirectUser = React.useCallback(
    (role: string | undefined) => {
      if (!role) {
        router.push(DEFAULT_REDIRECT);
        return;
      }
      const path = AUTH_REDIRECTS[role] || DEFAULT_REDIRECT;
      router.push(path);
    },
    [router]
  );

  return { redirectUser };
}

// -- Main Facade Hook --

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);
  const storeSetProfile = useAuthStore((s) => s.setProfile);
  
  const isAuthenticated = status === 'authenticated';
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = React.useCallback(() => {
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
    status, 
    error,
    isAuthenticated, 
    login,
    logout,
    setProfile: storeSetProfile,
    uploadPhoto: async (file: File) => {
        const response = await authApi.uploadProfilePicture(file);
        // Safely access avatar from profile
        const newAvatar = (response.profile as any)?.avatar || response.user?.avatar;
        
        // Update user state with new avatar
        storeLogin({
            user: { ...user!, avatar: newAvatar },
             profile: response.profile,
             accessToken: getAccessToken() || '', 
             refreshToken: '', 
        });
        // Also invalidate queries
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    updateProfile: async (data: any) => {
         const response = await authApi.updateProfile(data);
          storeLogin({
            user: { ...user!, ...data }, // Optimistic update or waiting for response
            profile: response.profile,
            accessToken: getAccessToken() || '',
            refreshToken: '',
        });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  };
}

// -- Feature Hooks --

/**
 * Shared success handler for login/register
 */
function useAuthSuccess() {
  const { login } = useAuth();
  const { redirectUser } = useAuthRedirect();
  const queryClient = useQueryClient();

  return (response: any, successMessage: string) => {
    // 1. Update Store
    // Support both 'access'/'refresh' and 'access_token'/'refresh_token' formats
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

    // 4. Redirect
    redirectUser(response.user?.role);

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
 * Hook for Google login
 */
export function useGoogleLogin() {
  const handleSuccess = useAuthSuccess();

  return useMutation({
    mutationFn: (token: string) => authApi.googleLogin(token),
    onSuccess: (response: AuthResponse) => {
      handleSuccess(response, 'Successfully signed in with Google!');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Google login failed. Please try again.';
      toast.error(message);
    },
  });
}

/**
 * Hook for fetching user profile
 */
export function useProfile() {
  const { setProfile, user } = useAuth();
  
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response;
    },
    // Only fetch if we have a token AND we have a user (meaning we are authenticated)
    // OR if we are in a specific 'checking' state?
    // Actually, usually we fetch profile to hydrate the store.
    enabled: !!getAccessToken(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data } = query;
  
  // Robust Synchronization
  // Only update if data exists AND it's different or we don't have it yet.
  React.useEffect(() => {
    if (data?.profile && user) {
        // We could add a deep comparison here to avoid setProfile if identical,
        // but for now, we trust React's batching or Zustand's equality check (if implemented).
        // Since setProfile just replaces the object, it might trigger updates.
        // Ideally, we check an ID or version.
        // For this refactor, we ensure it only runs when 'data' changes.
        setProfile(data.profile);
    }
  }, [data, setProfile, user]); // Added user to deps to ensure we don't set profile if user is null

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
