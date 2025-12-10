import type {
  User,
  UserProfile,
  StudentProfile,
  LandlordProfile,
  CaretakerProfile,
  AuthResponse as AuthResponseType,
} from './auth.types';

import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'student' | 'landlord' | 'caretaker';
}

export interface StudentRegisterRequest extends RegisterRequest {
  role: 'student';
}

export interface LandlordRegisterRequest extends RegisterRequest {
  role: 'landlord';
  businessName: string;
}

export interface CaretakerRegisterRequest extends RegisterRequest {
  role: 'caretaker';
  hostelId?: string;
  employmentStartDate?: string;
  nationalId?: string;
}

export interface EmailVerificationRequest {
  email?: string;
  otp: string;
  token?: string;
}

export interface PhoneVerificationRequest {
  phone: string;
  otp: string;
  token?: string;
}

export interface ResendOtpRequest {
  email?: string;
  phone?: string;
  token?: string;
  channel?: 'email' | 'sms';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface StudentProfileRequest {
  university: string;
  studentIdNumber: string;
  yearOfStudy: '1' | '2' | '3' | '4' | '5plus';
  course?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

export interface LandlordProfileRequest {
  nationalId: string;
  kraPin?: string;
  businessLicense?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  profile?: UserProfile | null;
}

export interface ProfileResponse {
  user: User;
  profile: UserProfile | null;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface PermissionsResponse {
  permissions: string[];
}

export interface MessageResponse {
  message: string;
  success?: boolean;
}

// ============================================================================
// GENERIC API TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  error?: string;
  message: string;
  statusCode?: number;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  User,
  UserProfile,
  StudentProfile,
  LandlordProfile,
  CaretakerProfile,
  AuthResponseType,
};

export type ApiRequestConfig = AxiosRequestConfig;
export type ApiAxiosResponse<T> = AxiosResponse<ApiResponse<T>>;
export type ApiAxiosError = AxiosError<ApiError>;
