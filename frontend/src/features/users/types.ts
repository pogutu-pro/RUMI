import { UserRole } from '@/features/auth/types/types';

export interface User {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  avatar?: string;
  profile_picture?: string;
  phoneNumber?: string;
  phone_number?: string;
  joinedAt: Date;
  created_at?: Date | string;
  lastActiveAt?: Date;
  is_verified?: boolean;
  bio?: string;
  urls?: {
    linkedin?: string;
    twitter?: string;
  };
}
