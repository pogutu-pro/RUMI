import { LifestylePreferences, BudgetPreferences, AvailabilityPreferences } from '@/features/profile/types';

// Roommate Profile
export interface RoommateProfile {
  id: string;
  userId: string;
  preferences: RoommatePreferences;
  bio: string;
  lifestyle: LifestylePreferences;
  budget: BudgetPreferences;
  availability: AvailabilityPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Roommate Match
export interface RoommateMatch {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedUser?: {
    id: string;
    name: string;
    avatar?: string;
    program?: string;
    year?: string;
  };
  compatibilityScore: number;
  matchReasons: string[];
  compatibilityBreakdown?: {
    strengths: string[];
    concerns: string[];
    suggestions: string[];
  };
  status: RoommateMatchStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RoommateRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: RoommateRequestStatus;
  
  // Multi-stage approval tracking
  roommateApprovalStatus?: 'pending' | 'approved' | 'rejected';
  roommateApprovedAt?: Date;
  caretakerApprovalStatus?: 'pending' | 'approved' | 'rejected';
  caretakerApprovedAt?: Date;
  approvedBy?: string; // caretaker or landlord ID
  
  createdAt: Date;
  respondedAt?: Date;
}

// Public roommate information for shared rooms
export interface RoommatePreview {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  program?: string;
  year?: string;
  compatibilityScore?: number;
  sleepSchedule?: 'early_bird' | 'night_owl' | 'flexible';
  cleanliness?: 'messy' | 'average' | 'neat' | 'ocd_level';
  noiseTolerance?: 'silent' | 'moderate' | 'background_chatter' | 'music_lover';
  isCurrentRoommate?: boolean;
}

// Enhanced Roommate Preferences with Personality Quiz
export interface RoommatePreferences {
  // Basic preferences (from signup)
  gender: 'male' | 'female' | 'any';
  ageRange: [number, number];
  smoking: boolean;
  pets: boolean;
  
  // Personality Quiz Answers (10 questions)
  weekendVibe?: 'netflix' | 'party' | 'study' | 'outdoor';
  sleepSchedule?: 'early_bird' | 'night_owl' | 'flexible' | 'catnapper';
  cleanliness?: 'messy' | 'average' | 'neat' | 'ocd_level';
  studySpot?: 'library' | 'room_desk' | 'cafeteria' | 'outdoors';
  noiseTolerance?: 'silent' | 'moderate' | 'background_chatter' | 'music_lover';
  foodMood?: 'snacks_only' | 'home_cooked' | 'fast_food' | 'gourmet';
  socialPreference?: 'always_social' | 'sometimes_social' | 'mostly_alone' | 'chill_gamer';
  petPreference?: 'love_pets' | 'okay_with_pets' | 'allergic' | 'no_pets';
  fridayNight?: 'hanging_with_friends' | 'gaming' | 'studying' | 'watching_shows';
  roomStyle?: 'minimalist' | 'cozy' | 'funky' | 'techy_modern';
  
  // Quiz metadata
  quizCompleted?: boolean;
  quizCompletedAt?: string;
  quizVersion?: string;
}

export type RoommateMatchStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired';
  
export type RoommateRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface RoommateSnapshot {
  id: string;
  name: string;
  avatar?: string;
  program: string;
  year: string;
  compatibilityScore?: number;
  isPrimaryContact?: boolean;
}
