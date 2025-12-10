import api from './client';
import type { Hostel } from '@/types/entities.types';
import type { ApiResponse } from '@/types/api.types';

export interface HostelsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Hostel[];
}

export const getHostels = async (params?: {
  search?: string;
  university?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  hostel_type?: string;
  gender_policy?: string;
  page?: number;
}): Promise<HostelsResponse> => {
  const response = await api.axios.get<HostelsResponse>('/hostels/', {
    params,
  });
  return response.data;
};


export const getHostelById = async (id: number): Promise<Hostel> => {
  const response = await api.axios.get<Hostel>(
    `/hostels/${id}/`,
  );
  if (!response.data) {
    throw new Error('Hostel not found');
  }
  return response.data;
};

// Assumes backend supports lookup by slug, or slug is actually an ID.
export const getHostelBySlug = async (slug: string): Promise<Hostel> => {
  const response = await api.axios.get<Hostel>(
    `/hostels/${slug}/`,
  );
  if (!response.data) {
    throw new Error('Hostel not found');
  }
  return response.data;
};

export const getHostel = getHostelBySlug;

export const getRelatedHostels = async (slug: string): Promise<Hostel[]> => {
  // Endpoint missing in backend. Return empty array.
  console.warn('getRelatedHostels endpoint is missing in backend.');
  return [];
};

export const createHostel = (
  data: Omit<
    Hostel,
    'id' | 'slug' | 'rating' | 'reviewsCount' | 'reviews' | 'rooms'
  >,
) => api.axios.post<ApiResponse<Hostel>>('/hostels/create/', data);

export const toggleFavoriteHostel = async (hostelId: string) => {
   // Endpoint missing in backend.
   console.warn('toggleFavoriteHostel endpoint is missing in backend.');
   return { data: { isFavorited: false } };
}

export const searchRooms = async (params: {
  query?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) => {
  // Confirmed /hostels/room-search/ exists in API setup guide for room searches.
  const response = await api.axios.get<ApiResponse<any>>('/hostels/room-search/', {
    params,
  });
  return response.data.data || [];
};

export const getFavorites = async (): Promise<Hostel[]> => {
    // Endpoint missing in backend.
    console.warn('getFavorites endpoint is missing in backend.');
    return []; 
};
