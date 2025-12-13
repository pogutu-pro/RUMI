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
  currency: string;
  rating: string;
  total_rooms: number;
  available_rooms: number;
  images: string[];
  amenities: Record<string, any>;
  amenities_list: string[];
  rules: string | null;
  landlord_phone: string;
  is_verified: boolean;
  is_active: boolean;
  has_inventory_template: boolean;
  review_count: number;
  created_at: string;
  
  // Computed/legacy fields
  pricePerMonth?: number;
  distanceToCampus?: number;
  lat?: number;
  lng?: number;
  reviewsCount?: number;
  houseRules?: string;
  verified?: boolean;
  roomsLeft?: number;
  isFavorited?: boolean;
  reviews?: Review[];
  rooms?: Room[];
}

export interface Room {
  id: string;
  name: string;
  number?: string;
  room_number?: string;
  roomNumber?: string;
  price: number;
  beds: number;
  capacity: number;
  images: string[];
  available: boolean;
  bookedDates: Date[];
}

export interface HostelInfo {
  id: string;
  name: string;
  roomNumber: string;
  buildingPhoto?: string;
  address: string;
  caretakerName?: string;
  caretakerPhone?: string;
}
