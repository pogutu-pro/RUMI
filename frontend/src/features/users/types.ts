import { Timestamp } from '@/features/auth/types/types';

export interface User {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'student' | 'landlord' | 'caretaker' | 'tech_support' | 'tech_support_admin' | 'super_admin' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  avatar?: string;
  profile_picture?: string;
  phoneNumber?: string;
  phone_number?: string;
  joinedAt: Date;
  created_at?: Date | string;
  lastActiveAt?: Date;
  is_verified?: boolean;
}
