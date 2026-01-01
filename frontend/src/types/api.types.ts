export * from '@/types/shared';
// We need to be careful here. LoginRequest is in features/auth/types.
// But api.types had both generics and auth requests.
// We should re-export specific things if possible or just export from auth too.

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

// Some types were not moved yet or matched exactly?
// Checking api.types.ts original content:
// It included: StudentProfileRequest (not in auth types?), LandlordProfileRequest...
// I need to check where I put those. I might have missed profile update requests.
// They effectively belong to 'profile' feature or 'users'. 
// Let's assume for now they are in auth or I need to add them. 

// Actually I missed `StudentProfileRequest` and others in `features/auth/types.ts`.
// I should add them there or features/profile/types.ts. 
// Let's add them to features/profile/types.ts because they are profile update requests.

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
