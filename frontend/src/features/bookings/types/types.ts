import { Hostel, Room } from '@/features/hostels/types';

export interface Booking {
  id: string;
  booking_reference: string;
  
  // Relations
  // Relations
  hostel?: Hostel;
  room?: Room;
  room_info?: {
      room_id: string;
      room_number: string;
      hostel_name: string;
  };
  student?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_picture?: string;
  };
  student_info?: {
      student_id: string;
      name: string;
      email: string;
  };
  
  // Dates
  move_in_date: string; // ISO string (Standardized name)
  check_out_date?: string; // ISO string
  is_existing_resident?: boolean;
  created_at: string;
  updated_at?: string;
  
  // Financials
  total_amount: number;
  monthly_rent?: number;
  duration_months: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'failed';
  
  // Status
  status: 'pending' | 'confirmed' | 'checked_in' | 'inspection_pending' | 'cancelled' | 'completed' | 'expired';
}

export interface WaitlistEntry {
  id: string;
  student_id: string;
  hostel_id: string;
  room_type_preference?: string;
  status: 'active' | 'contacted' | 'converted' | 'cancelled';
  created_at: string;
}
