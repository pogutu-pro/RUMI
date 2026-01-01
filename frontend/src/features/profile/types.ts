import { ID, Timestamp, Nullable, UserRole } from '@/features/auth/types/types';
import { User } from '@/features/users/types';

// ==================== Preferences ====================

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

export type CommunicationStyle = 'direct' | 'thoughtful' | 'supportive' | 'humorous';
export type ConflictResolutionStyle = 'seek_peace' | 'address_directly' | 'avoid_conflict' | 'debate_openly';
export type SupportStyle = 'emotional_support' | 'practical_help' | 'motivational' | 'listener';
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

  // Additional lifestyle fields
  socialLevel?: 'very_social' | 'moderate' | 'private' | 'introvert' | 'extrovert'; // merged variations
  cookingFrequency?: 'never' | 'sometimes' | 'often' | 'always';
  entertainment?: string[];
  hobbies?: string[];

  sleepSchedule?: 'early_bird' | 'night_owl' | 'flexible';
  cleanliness?: 'very_clean' | 'moderate' | 'relaxed';
  noiseTolerance?: 'quiet' | 'moderate' | 'lively';
  studyHabits?: 'library' | 'room' | 'flexible';
  smoking?: boolean;
  pets?: boolean;
  visitors?: 'frequent' | 'occasional' | 'rare';
}

export interface BudgetPreferences {
  minBudget: number;
  maxBudget: number;
  utilitiesIncluded: boolean;
}

export interface AvailabilityPreferences {
  moveInDate: Date;
  leaseDuration: number; // months
  flexibleDates: boolean;
}

// ==================== Profiles ====================

export type YearOfStudy = 1 | 2 | 3 | 4 | 5 | '5+' | number | `${number}`;

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  categories?: {
    payments: boolean;
    messages: boolean;
    bookings: boolean;
    maintenance: boolean;
    announcements: boolean;
  };
    // Alternative structure from auth.types.ts
    id?: ID;
    userId?: ID;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    marketingEmails?: boolean;
    bookingUpdates?: boolean;
    user_id?: ID;
    email_enabled?: boolean;
    sms_enabled?: boolean;
    marketing_emails?: boolean;
    booking_updates?: boolean;
    payment_reminders?: boolean;
    roommate_updates?: boolean;
    marketplace_updates?: boolean;
    updated_at?: Timestamp;
}

export interface StudentProfile extends User { // Needs reconciliation: User fields + Profile fields
  type: 'student';
  // User fields are inherited via extension if we treat it as a rich user object, 
  // or we separate them. entities.types.ts mixed them.
  user_id?: ID; // if separate
  university?: string;
  student_id_number?: string;
  year_of_study?: YearOfStudy;
  course?: Nullable<string>;
  program?: string;
  
  lifestyle_preferences?: Nullable<LifestylePreferences>;
  
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  bio?: string;
  preferences?: NotificationPreferences;
  
  profile_completion_percentage?: number;
  is_profile_complete?: boolean;
}

export interface VerificationDocuments {
  submittedAt?: Timestamp;
  reviewedAt?: Nullable<Timestamp>;
  reviewedBy?: Nullable<ID>;
}

export interface LandlordProfile {
  type: 'landlord';
  id: ID;
  user_id: ID;
  national_id?: string;
  company_name?: string;
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

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
}

export interface UpdateStudentProfileRequest {
  university?: string;
  student_id_number?: string;
  year_of_study?: number;
  course?: string;
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  lifestyle_preferences?: LifestylePreferences;
}

export interface UpdateLandlordProfileRequest {
  companyName?: string; // from form
  company_name?: string; // backend
  national_id?: string;
  businessRegistrationNumber?: string; // from form
  taxPin?: string; // from form
  kra_pin?: string; // backend
  numberOfProperties?: number; // from form
  bank_name?: string;
  bankAccount?: string; // from form
  bank_account_number?: string; // backend
  bank_account_name?: string;
  bio?: string;
}

export interface UpdateCaretakerProfileRequest {
  yearsOfExperience?: number;
  specializations?: string;
  certifications?: string;
  availability?: string;
  national_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}
