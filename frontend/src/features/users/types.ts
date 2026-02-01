import { UserRole } from '@/features/auth/types/types';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  is_profile_complete?: boolean;
  phone_number?: string;
  profile_picture?: string;
  avatar?: string;
  onboarding_stage?: 
    | 'REGISTERED' 
    | 'ROLE_SELECTED' 
    | 'IDENTITY_DRAFT' 
    | 'IDENTITY_VERIFIED' 
    | 'VERIFICATION_PENDING' 
    | 'COMPLETED';
  capabilities?: string[];
  status?: 'active' | 'suspended' | 'inactive';
  is_2fa_enabled?: boolean;
  bio?: string;
  urls?: {
    instagram?: string;
    tiktok?: string;
  };
  created_at?: string;
  last_login?: string;
}
