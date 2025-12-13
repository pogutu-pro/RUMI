'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth';
import { getAccessToken } from '@/lib/auth/token';
import { useAuthStore } from '../stores/auth.store';
import type {
  LoginRequest,
  ForgotPasswordRequest,
  EmailVerificationRequest,
  PhoneVerificationRequest,
  ResendOtpRequest,
  CaretakerRegisterRequest,
  LandlordRegisterRequest,
  StudentRegisterRequest,
  StudentProfileRequest,
  ResetPasswordRequest,
  AuthResponse,
} from '@/types/api.types';
import { toast } from 'sonner';

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore();
  return { user, isAuthenticated, logout };
}

/**
 * Hook for user registration
 * Handles user registration and redirects on success
 */
export function useRegister() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data:
        | StudentRegisterRequest
        | LandlordRegisterRequest
        | CaretakerRegisterRequest,
    ) => {
      // Determine the registration method based on the data type
      if ('role' in data) {
        if (data.role === 'student') {
          return authApi.registerStudent(data as StudentRegisterRequest);
        } else if (data.role === 'landlord') {
          return authApi.registerLandlord(data as LandlordRegisterRequest);
        } else if (data.role === 'caretaker') {
          return authApi.registerCaretaker(data as CaretakerRegisterRequest);
        }
      }
      throw new Error('Invalid registration data');
    },
    onSuccess: (response: AuthResponse) => {
      // Update auth store
      setAuth({
        user: response.user,
        profile: response.profile,
        accessToken: response.access,
        refreshToken: response.refresh,
      });

      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Redirect to appropriate dashboard based on role
      const role = response.user?.role;
      if (role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (role === 'tech_support_admin' || role === 'tech_support') {
        router.push('/tech-support/dashboard');
      } else if (role === 'landlord') {
        router.push('/landlord/dashboard');
      } else if (role === 'caretaker') {
        router.push('/caretaker/dashboard');
      } else {
        // Default to student dashboard
        router.push('/student/dashboard');
      }

      toast.success('Registration successful!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });
}

/**
 * Hook for user login
 * Handles authentication and redirects on success
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      // Update auth store
      setAuth({
        user: response.user,
        profile: response.profile,
        accessToken: response.access,
        refreshToken: response.refresh,
      });

      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      // Redirect based on user role
      // Redirect based on user role
      const role = response.user?.role;
      if (role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (role === 'tech_support_admin' || role === 'tech_support') {
        router.push('/tech-support/dashboard');
      } else if (role === 'landlord') {
        router.push('/landlord/dashboard');
      } else if (role === 'caretaker') {
        router.push('/caretaker/dashboard');
      } else {
        router.push('/student/dashboard');
      }

      toast.success('Welcome back!');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please try again.';
      toast.error(message);
    },
  });
}

/**
 * Hook for Google login
 * Handles Google OAuth flow and backend authentication
 */
export function useGoogleLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (token: string) => authApi.googleLogin(token),
    onSuccess: (response) => {
      // Update auth store
      setAuth({
        user: response.user,
        profile: response.profile,
        accessToken: response.access,
        refreshToken: response.refresh,
      });

      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      // Redirect based on user role
      // Redirect based on user role
      const role = response.user?.role;
      if (role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (role === 'tech_support_admin' || role === 'tech_support') {
        router.push('/tech-support/dashboard');
      } else if (role === 'landlord') {
        router.push('/landlord/dashboard');
      } else if (role === 'caretaker') {
        router.push('/caretaker/dashboard');
      } else {
        router.push('/student/dashboard');
      }

      toast.success('Successfully signed in with Google!');
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
 * Hook for forgot password functionality
 * Sends password reset instructions to user's email
 */
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

/**
 * Hook for fetching user profile
 * Returns user profile data and loading state
 */
export function useProfile() {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.getProfile();
      if (response.user) {
        setAuth({
          user: response.user,
          profile: response.profile,
        });
      }
      return response;
    },
    enabled: !!getAccessToken(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for email verification
 */
// In src/hooks/use-auth.ts, update the useVerifyEmail hook
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: { email?: string; otp: string; token?: string }) =>
      authApi.verifyEmail({
        email: data.email,
        otp: data.otp,
        token: data.token,
      }),
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

/**
 * Hook for phone verification
 */
export function useVerifyPhone() {
  return useMutation({
    mutationFn: (data: { phone: string; otp: string }) =>
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

/**
 * Hook for resending verification code
 */
export function useResendVerification() {
  return useMutation({
    mutationFn: (data: ResendOtpRequest) => authApi.resendOtp(data),
    onSuccess: () => {
      toast.success('Verification code sent successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send verification code');
    },
  });
}

/**
 * Hook for caretaker registration
 */
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
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to register caretaker',
      );
    },
  });
}

/**
 * Hook for landlord registration
 */
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
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to register landlord',
      );
    },
  });
}

/**
 * Hook for student registration
 */
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
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to register student',
      );
    },
  });
}

/**
 * Hook for resetting password
 */
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });
}
