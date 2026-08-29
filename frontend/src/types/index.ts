export * from './auth.types';
export * from './forms.types';
export * from './ui.types';

// Entities Types - resolving conflicts with auth.types
export type {
  BudgetPreferences,
  AvailabilityPreferences,
  // User, // Conflicting with auth.types
} from './entities.types';

// Aliases for conflicting entity types
export type {
  User as EntityUser,
  LifestylePreferences as EntityLifestylePreferences,
} from './entities.types';

// API Types - resolving conflicts with auth.types
export type {
  EmailVerificationRequest,
  PhoneVerificationRequest,
  ResendOtpRequest,
  UpdateStudentProfileRequest,
  UpdateLandlordProfileRequest,
  RefreshTokenRequest,
  ProfileResponse,
  TokenResponse,
  PermissionsResponse,
  PaginationParams,
  ApiRequestConfig,
  ApiAxiosResponse,
  ApiAxiosError,
} from './api.types';
