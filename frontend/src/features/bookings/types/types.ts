import { Hostel, Room } from '@/features/hostels/types';

export interface Booking {
  id: string;
  hostel: Hostel;
  room: Room;
  // Backend snake_case mappings
  student_id?: string;
  student?: { // Often includes full object
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    profile_picture?: string;
  } | string; 
  check_in_date?: string; // Backend often returns this
  move_in_date?: string; // Or this
  // Frontend camelCase (keep for legacy compatibility if mapped)
  moveInDate: Date;
  
  durationMonths: number;
  duration_months?: number; // Backend
  
  totalPrice: number;
  total_amount?: number; // Backend?
  monthly_rent?: number;
  
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; // Added completed
  paymentMethod: 'mpesa' | 'bank';
  
  studentId: string;
  studentName: string;
  
  hostelName: string;
  
  roomNumber: string;
  room_number?: string; // Backend
  
  amount: number;
  duration: string;
  
  reference?: string; // Payment reference
  created_at?: string;
  updated_at?: string;
}
