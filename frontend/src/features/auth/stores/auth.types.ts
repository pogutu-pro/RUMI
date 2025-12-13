import { User } from '../types/types';
import { StudentProfile, LandlordProfile, CaretakerProfile } from '@/features/profile/types';

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

export interface AuthActions {
  login: (payload: { user: User; accessToken: string; refreshToken?: string; profile?: UserProfile }) => void;
  logout: () => void;
  hydrate: () => void;
  setProfile: (profile: UserProfile) => void;
  updateUser: (updates: Partial<User>) => void;
  setError: (error: string) => void;
}

export type AuthSlice = AuthState & AuthActions;
