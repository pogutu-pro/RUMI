export * from '@/types/shared';


export type {
  LoginRequest,
  RegisterRequest,
  RegisterBaseRequest,
  StudentRegisterRequest,
  LandlordRegisterRequest,
  CaretakerRegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  RefreshTokenRequest,
  ProfileResponse,
  TokenResponse,
  PermissionsResponse,
  MessageResponse,
  EmailVerificationRequest,
  PhoneVerificationRequest,
  ResendOtpRequest,
  UserProfile,
} from '@/features/auth/types/types';

export type {
    UpdateStudentProfileRequest,
    UpdateLandlordProfileRequest,
    StudentProfile,
    LandlordProfile,
} from '@/features/profile/types';

// ApiRequestConfig was just AxiosRequestConfig alias.
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types/shared';
export type { User } from '@/features/users/types';
export type { ApiResponse, ApiError };

export type ApiRequestConfig = AxiosRequestConfig;
export type ApiAxiosResponse<T> = AxiosResponse<ApiResponse<T>>;
export type ApiAxiosError = AxiosError<ApiError>;
