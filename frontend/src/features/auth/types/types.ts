import { User } from '@/features/users/types';

export type ID = string;
export type Timestamp = string;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type JSONB = Record<string, unknown>;

export const USER_ROLES = [
  'student',
  'landlord',
  'caretaker',
  'tech_support_admin',
  'tech_support',
  'super_admin',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const UserRole = {
  STUDENT: 'student',
  LANDLORD: 'landlord',
  CARETAKER: 'caretaker',
  TECH_SUPPORT_ADMIN: 'tech_support_admin',
  TECH_SUPPORT: 'tech_support',
  SUPER_ADMIN: 'super_admin',
} as const;

import { StudentProfile, LandlordProfile, CaretakerProfile } from '@/features/profile/types';

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Re-export User for convenience in Auth context
export type { User }; 

export type UserProfile = StudentProfile | LandlordProfile | CaretakerProfile;

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  profile?: Nullable<UserProfile>;
}

export interface RefreshTokenResponse {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterBaseRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
}

export interface RegisterRequest extends RegisterBaseRequest {
    [key: string]: any; // Allow extensibility for role-specific fields
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  email?: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
  otp?: string;
}


export interface ResendVerificationRequest {
  email: string;
  type?: 'email' | 'phone';
}

// Specific Registration Requests
export interface StudentRegisterRequest extends RegisterBaseRequest {
  role: 'student';
  [key: string]: any;
}

export interface LandlordRegisterRequest extends RegisterBaseRequest {
  role: 'landlord';
  [key: string]: any;
}

export interface CaretakerRegisterRequest extends RegisterBaseRequest {
  role: 'caretaker';
  [key: string]: any;
}

// Response Types
export interface ProfileResponse {
    user: User;
    profile: UserProfile;
}

export interface TokenResponse extends AuthTokens {}

export interface PermissionsResponse {
    permissions: string[];
}

export interface MessageResponse {
    message: string;
}

export interface RefreshTokenRequest {
    refresh: string;
}

// Aliases for compatibility with use-auth hooks
export type EmailVerificationRequest = VerifyEmailRequest;
export type PhoneVerificationRequest = VerifyEmailRequest; // Assuming same structure for now
export type ResendOtpRequest = ResendVerificationRequest;


export interface AuthState {
  user: Nullable<User>;
  profile: Nullable<UserProfile>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;
}

export interface FormState<T = unknown> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  categories: {
    marketing: boolean;
    transactional: boolean;
    updates: boolean;
  };
}
