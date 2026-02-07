import { Review } from '@/features/reviews/types';

export interface Hostel {
  id: number;
  slug: string;
  landlord: number;
  landlord_name: string;
  name: string;
  description: string;
  address: string;
  city: string;
  university: string;
  distance_from_university: string | null;
  latitude: string | null;
  longitude: string | null;
  hostel_type: 'single_rooms' | 'shared_rooms' | 'mixed';
  gender_policy: 'male_only' | 'female_only' | 'mixed';
  status: 'active' | 'inactive' | 'under_maintenance';
  base_price: string;
  deposit_amount: string;
  currency: string;
  rating: string;
  total_rooms: number;
  available_rooms: number;
  images: string[];
  amenities: any[];
  amenities_list: string[];
  rules: string | null;
  landlord_phone: string;
  landlord_info?: {
    company_name: string;
    phone: string;
    response_rate: number;
    average_response_time: string;
    verified_since: string | null;
    trust_score: number;
  };
  verification_data: Record<string, any>;
  contact_preferences: Record<string, any>;
  is_verified: boolean;
  is_active: boolean;
  has_inventory_template: boolean;
  review_count: number;
  created_at: string;
  
  // Wizard Data
  caretaker_name?: string;
  caretaker_phone?: string;
  total_floors?: number;
  safety_features?: string[];
  payment_terms?: string;
  payment_cycle?: 'monthly' | 'semester' | 'annual';
  grace_period_days?: number;
  late_fee_percent?: string;
  tenant_type?: 'students_only' | 'anyone';
  minimum_stay?: string;
  mid_term_joins_allowed?: boolean;
  
  // Computed/UI helpers
  is_favorited?: boolean;
  reviews?: Review[];
  rooms?: Room[];
}

export interface Bed {
  id: string;
  code: string;
  full_code: string;
  bed_type: 'single' | 'bunk_top' | 'bunk_bottom' | 'double';
  price_override: string | null;
  is_active: boolean;
  custom_account_number: string | null; // Added custom account number
}

export interface Room {
  id: string;
  room_number: string;
  base_price: string; // Unified as string for Decimal precision
  capacity: number;
  images: string[];
  is_available: boolean;
  floor?: number;
  semester_price?: string;
  deposit_required?: string;
  detailed_attributes?: Record<string, any>;
  description?: string;
  amenities?: Record<string, any>;
  bookedDates?: Date[];
  beds?: Bed[];
}

export interface HostelInfo {
  id: string;
  name: string;
  room_number: string;
  building_photo?: string;
  address: string;
  caretaker_name?: string;
  caretaker_phone?: string;
}
