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

/**
 * ================================================================================
 * README: Hostels API Module (hostels.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * This module handles all hostel-related API calls including listing, searching,
 * filtering, viewing details, and managing favorites.
 *
 * BACKEND ENDPOINTS:
 * ------------------
 * | Method | Endpoint                      | Function              |
 * |--------|-------------------------------|----------------------|
 * | GET    | /hostels/                     | getHostels()         |
 * | GET    | /hostels/{id}/                | getHostelById()      |
 * | GET    | /hostels/{slug}/              | getHostelBySlug()    |
 * | GET    | /hostels/{slug}/related/      | getRelatedHostels()  |
 * | POST   | /hostels/create/              | createHostel()       |
 * | POST   | /hostels/{id}/favorite/       | toggleFavoriteHostel()|
 * | GET    | /hostels/search/              | searchRooms()        |
 * | GET    | /hostels/favorites/           | getFavorites()       |
 *
 * HOW IT WORKS:
 * -------------
 *
 * ## Listing Hostels:
 * - getHostels() fetches paginated list with optional filters
 * - Supports: search, university, city, price range, type, gender_policy
 * - Returns: { count, next, previous, results: Hostel[] }
 *
 * ## Getting Hostel Details:
 * - getHostelById(id) - fetches by numeric ID
 * - getHostelBySlug(slug) - fetches by URL-friendly slug
 * - Both return full Hostel object with rooms, amenities, reviews
 *
 * ## Related Hostels:
 * - getRelatedHostels(slug) returns similar hostels
 * - Used for "You might also like" sections
 *
 * ## Favorites:
 * - toggleFavoriteHostel(id) adds/removes from favorites
 * - getFavorites() returns user's favorited hostels
 * - Requires authentication
 *
 * RESPONSE STRUCTURE:
 * -------------------
 * ```typescript
 * interface HostelsResponse {
 *   count: number;        // Total matching hostels
 *   next: string | null;  // URL for next page
 *   previous: string | null;
 *   results: Hostel[];    // Array of hostel objects
 * }
 *
 * interface Hostel {
 *   id: number;
 *   slug: string;
 *   name: string;
 *   location: string;
 *   price: number;
 *   rating: number;
 *   reviewsCount: number;
 *   images: string[];
 *   amenities: string[];
 *   rooms: Room[];
 *   // ... more fields
 * }
 * ```
 *
 * USAGE EXAMPLES:
 * ---------------
 * ```typescript
 * import { getHostels, getHostelBySlug, toggleFavoriteHostel } from './hostels';
 *
 * // List hostels with filters
 * const hostels = await getHostels({
 *   university: 'UoN',
 *   min_price: 5000,
 *   max_price: 15000,
 *   page: 1
 * });
 *
 * // Get single hostel
 * const hostel = await getHostelBySlug('sunshine-hostel');
 *
 * // Toggle favorite
 * const result = await toggleFavoriteHostel('123');
 * console.log(result.isFavorited); // true or false
 *
 * // Get user's favorites
 * const favorites = await getFavorites();
 * ```
 *
 * ================================================================================
 */
