import { UserRole } from '@/features/auth/types/types';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  phone_number?: string;
  profile_picture?: string;
  avatar?: string;
  status?: 'active' | 'suspended' | 'inactive';
  is_2fa_enabled?: boolean;
  created_at?: string;
  last_login?: string;
}
