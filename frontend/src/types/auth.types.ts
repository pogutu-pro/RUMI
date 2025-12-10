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

export const NOTIFICATION_TYPES = [
  'booking_confirmation',
  'payment_receipt',
  'payment_reminder',
  'email_verification',
  'password_reset',
  'profile_update',
  'system_maintenance',
  'marketing',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationChannel = 'email' | 'sms' | 'in_app';

export interface User {
  id: ID;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  isEmailVerified?: boolean;
  phone?: string;
  phoneNumber?: string;
  profileImage?: Nullable<string>;
  avatar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PersonalityType = 'introvert' | 'extrovert' | 'ambivert';

export type CoreValue =
  | 'loyalty'
  | 'honesty'
  | 'solidarity'
  | 'courage'
  | 'empathy'
  | 'justice'
  | 'community'
  | 'respect'
  | 'open_mindedness';

export type CommunicationStyle =
  | 'direct'
  | 'thoughtful'
  | 'supportive'
  | 'humorous';

export type ConflictResolutionStyle =
  | 'seek_peace'
  | 'address_directly'
  | 'avoid_conflict'
  | 'debate_openly';

export type SupportStyle =
  | 'emotional_support'
  | 'practical_help'
  | 'motivational'
  | 'listener';

export type SocialFrequency = 'daily' | 'weekly' | 'monthly' | 'sporadic';

export type CollaborationInterest = 'yes' | 'maybe' | 'no';

export interface LifestylePreferences {
  personalityType?: PersonalityType;
  coreValues?: CoreValue[];
  communicationStyle?: CommunicationStyle;
  conflictResolution?: ConflictResolutionStyle;
  supportStyle?: SupportStyle;
  socialFrequency?: SocialFrequency;
  dealbreakers?: string[];
  openness?: number;
  collaborationInterest?: CollaborationInterest;

  sleepSchedule?: 'early_bird' | 'night_owl' | 'flexible';
  cleanliness?: 'very_clean' | 'moderate' | 'relaxed';
  noiseTolerance?: 'quiet' | 'moderate' | 'lively';
  studyHabits?: 'library' | 'room' | 'flexible';
  socialLevel?: 'very_social' | 'moderate' | 'private';
  smoking?: boolean;
  pets?: boolean;
  visitors?: 'frequent' | 'occasional' | 'rare';
}

/* Student Profile  */

export type YearOfStudy = 1 | 2 | 3 | 4 | 5 | '5+' | number | `${number}`;

export interface StudentProfile {
  type: 'student';
  id: ID;
  userId: ID;
  university: string;
  studentIdNumber: string;
  yearOfStudy: YearOfStudy;
  course?: Nullable<string>;
  lifestylePreferences?: Nullable<LifestylePreferences>;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  profileCompletionPercentage: number; // 0-100
  isProfileComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* Landlord Profile */

export interface VerificationDocuments {
  nationalId?: string;
  kraPin?: string;
  businessLicense?: string;
  submittedAt?: Timestamp;
  reviewedAt?: Nullable<Timestamp>;
  reviewedBy?: Nullable<ID>;
}

export interface LandlordProfile {
  type: 'landlord';
  id: ID;
  userId: ID;
  nationalId?: string;
  businessName?: string;
  kraPin?: Nullable<string>;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountName?: string;
  paystackSubaccountCode?: Nullable<string>;
  isVerified: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationDocuments?: Nullable<VerificationDocuments>;
  rejectionReason?: Nullable<string>;
  totalHostels?: number;
  totalRooms?: number;
  totalEarnings?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* Caretaker Profile  */

export interface CaretakerPermissions {
  viewInventory: boolean;
  manageInventory: boolean;
  viewTenants: boolean;
  approveCheckOut: boolean;
  handleMaintenance: boolean;
  viewFinancials: boolean;

  updateInventory?: boolean;
  approveDamageReports?: boolean;
  approveCheckOutLegacy?: boolean;
}

export interface CaretakerProfile {
  type: 'caretaker';
  id: ID;
  userId: ID;
  hostelId: ID;
  hostelName?: string;
  landlordId: ID;
  landlordName?: string;
  employmentStartDate: Timestamp;
  permissions: CaretakerPermissions;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* Union Types  */

export type UserProfile = StudentProfile | LandlordProfile | CaretakerProfile;

/*  Auth APIs  */

export interface AuthTokens {
  access: string;
  refresh: string;
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

/* Role-specific register payloads*/
export interface StudentRegisterRequest extends RegisterBaseRequest {
  role: 'student';
  studentId: string;
  university: string;
  course?: string;
  yearOfStudy?: YearOfStudy;
}

export interface LandlordRegisterRequest extends RegisterBaseRequest {
  role: 'landlord';
  businessName: string;
  idNumber?: string;
  nationalId?: string;
}

export interface CaretakerRegisterRequest extends RegisterBaseRequest {
  role: 'caretaker';
  idNumber?: string;
  hostelId?: string;
  employmentStartDate?: Timestamp;
}

export type RegisterRequest =
  | StudentRegisterRequest
  | LandlordRegisterRequest
  | CaretakerRegisterRequest;

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

/* Generic API response wrapper */
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
  timestamp?: Timestamp;
}

/*Notifications & Prefs */

export interface Notification {
  id: ID;
  recipientId: ID;
  notificationType: NotificationType;
  channel: NotificationChannel;
  title?: string;
  message: string;
  metadata?: JSONB;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sentAt?: Nullable<Timestamp>;
  readAt?: Nullable<Timestamp>;
  createdAt: Timestamp;
}

export interface NotificationPreferences {
  id: ID;
  userId: ID;
  emailEnabled: boolean;
  smsEnabled: boolean;
  marketingEmails: boolean;
  bookingUpdates: boolean;
  paymentReminders: boolean;
  roommateUpdates: boolean;
  marketplaceUpdates: boolean;
  updatedAt: Timestamp;
}

/*  RBAC Types  */

export interface Permission {
  id: ID;
  codename: string;
  description?: string;
}

export interface RolePermission {
  id: ID;
  role: UserRole;
  permissionId: ID;
  permission?: Permission;
}

/* Frontend State  */

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

/*  Utility Types  */

export interface FormState<T = unknown> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/* Type Guards  */

export const isStudentProfile = (
  p: UserProfile | null | undefined,
): p is StudentProfile => !!p && (p as StudentProfile).type === 'student';

export const isLandlordProfile = (
  p: UserProfile | null | undefined,
): p is LandlordProfile => !!p && (p as LandlordProfile).type === 'landlord';

export const isCaretakerProfile = (
  p: UserProfile | null | undefined,
): p is CaretakerProfile => !!p && (p as CaretakerProfile).type === 'caretaker';

export const userHasRole = (u: Nullable<User>, role: UserRole) =>
  !!u && u.role === role;
