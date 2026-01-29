import { Hostel, Room } from '@/features/hostels/types';

export interface Booking {
  id: string;
  reference?: string;
  
  // Relations
  hostel: Hostel | { id: string; name: string }; // Handle expanded or minimal
  room: Room | { id: string; number: string; room_number?: string; roomNumber?: string };
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
  } | string; // Can be ID or object
  
  // Dates
  check_in_date: string; // ISO string
  check_out_date?: string; // ISO string
  created_at: string;
  updated_at?: string;
  
  // Financials
  total_amount: number;
  monthly_rent?: number;
  duration_months: number;
  payment_status?: 'pending' | 'paid' | 'partial' | 'failed';
  
  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  
  // Legacy/Frontend helpers (mapped optional)
  studentName?: string;
  hostelName?: string;
  roomNumber?: string;
  moveInDate?: Date; // Optional helper
}
