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
  'super_admin',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const UserRole = {
  STUDENT: 'student',
  LANDLORD: 'landlord',
  CARETAKER: 'caretaker',
  TECH_SUPPORT_ADMIN: 'tech_support_admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Re-export User for convenience in Auth context
export type { User }; 
// Note: We might need to reconcile the Auth 'User' vs Entity 'User' if they differ significantly.
// For now, importing the standardized User from features/users is the goal.

export interface UserProfile { // Union type placeholder, will define specific profiles in features/profile
    type: 'student' | 'landlord' | 'caretaker';
    id: ID;
    user_id: ID;
    [key: string]: any;
}

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
