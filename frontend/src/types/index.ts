export * from './auth.types';
export * from './forms.types';
export * from './ui.types';
export * from './subscription.types';

// Entities Types - resolving conflicts with auth.types
export type {
  RoommateProfile,
  RoommateMatch,
  RoommateRequest,
  TransferListing,
  TransferRequest,
  TransferApproval,
  Conversation,
  Message,
  SupportTicket,
  TicketReply,
  PlatformAnalytics,
  RoommatePreferences,
  Hostel,
  Room,
  Review,
  // LifestylePreferences, // Conflicting with auth.types
  BudgetPreferences,
  AvailabilityPreferences,
  RoommateMatchStatus,
  RoommateRequestStatus,
  TransferStatus,
  TransferRequestStatus,
  MessageType,
  SupportCategory,
  SupportPriority,
  SupportStatus,
  GrowthMetrics,
  AnalyticsPeriod,
  Booking,
  Payment,
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
  MessageResponse,
  PaginationParams,
  ApiRequestConfig,
  ApiAxiosResponse,
  ApiAxiosError,
} from './api.types';
