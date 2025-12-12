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
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  is_email_verified?: boolean;
  phone?: string;
  phone_number?: string; // Add snake_case alias if needed or stick to one. Backend likely uses phone_number
  profile_picture?: Nullable<string>;
  avatar?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  date_joined?: Timestamp; // Added based on error report
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
  user_id: ID;
  university: string;
  student_id_number: string;
  year_of_study: YearOfStudy;
  course?: Nullable<string>;
  lifestyle_preferences?: Nullable<LifestylePreferences>;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  profile_completion_percentage: number; // 0-100
  is_profile_complete: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
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
  user_id: ID;
  national_id?: string;
  business_name?: string;
  kra_pin?: Nullable<string>;
  bank_account_number?: string;
  bank_name?: string;
  bank_account_name?: string;
  paystack_subaccount_code?: Nullable<string>;
  is_verified: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected';
  verification_documents?: Nullable<VerificationDocuments>;
  rejection_reason?: Nullable<string>;
  total_hostels?: number;
  total_rooms?: number;
  total_earnings?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
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
  user_id: ID;
  hostel_id: ID;
  hostel_name?: string;
  landlord_id: ID;
  landlord_name?: string;
  employment_start_date: Timestamp;
  permissions: CaretakerPermissions;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
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
  recipient_id: ID;
  notification_type: NotificationType;
  channel: NotificationChannel;
  title?: string;
  message: string;
  metadata?: JSONB;
  status: 'pending' | 'sent' | 'failed' | 'read'; // keeping status as is, checking usage
  type?: string; // Add type as implicit string if needed, or stick to notification_type
  is_read: boolean; // Add is_read
  sent_at?: Nullable<Timestamp>;
  read_at?: Nullable<Timestamp>;
  created_at: Timestamp;
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
