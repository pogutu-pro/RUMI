import { User } from '../types/types';
import { StudentProfile, LandlordProfile, CaretakerProfile } from '@/features/profile/types';

// Strict Role definitions to avoid magic strings
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  TECH_SUPPORT_ADMIN = 'tech_support_admin',
  TECH_SUPPORT = 'tech_support',
  LANDLORD = 'landlord',
  CARETAKER = 'caretaker',
  STUDENT = 'student',
  // Canonical RUMIA rental role — legacy 'student' accounts map to this
  // server-side via User.get_canonical_role(). New tenant registrations use this directly.
  TENANT = 'tenant',
}

export type AuthStatus = 
  | 'idle' 
  | 'checking' 
  | 'authenticated' 
  | 'unauthenticated' 
  | 'error';

export type UserProfile = StudentProfile | LandlordProfile | CaretakerProfile;

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  accessToken: string | null;
  error: string | null;
}

export type LoginPayload = {
  user: User;
  accessToken: string;
  refreshToken?: string;
  profile?: UserProfile;
};

export interface AuthActions {
  /**
   * successfully authenticated - sets state to 'authenticated'
   */
  login: (payload: LoginPayload) => void;
  
  /**
   * clears all auth data and sets state to 'unauthenticated'
   */
  logout: () => void;
  
  /**
   * checks for existing token to fast-track auth state
   * strictly for initialization
   */
  hydrate: () => void;
  
  /**
   * Updates just the profile part of the state
   */
  setProfile: (profile: UserProfile) => void;
  
  /**
   * Updates partial user data
   */
  updateUser: (updates: Partial<User>) => void;
  
  /**
   * Re-hydrates the store with full user and profile data
   */
  rehydrate: (user: User, profile: UserProfile) => void;
  
  /**
   * Sets error state
   */
  setError: (error: string) => void;
}

export type AuthSlice = AuthState & AuthActions;
