import apiClient from '@/lib/api/client';
import type { Hostel, Room } from '@/types/entities.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface HostelsResponse {
  current_page: number; // Adapting to PaginatedResponse likely structure
  total_pages: number;
  count: number;
  results: Hostel[];
}

export const hostelsApi = {
  // List Hostels
  // GET /hostels/
  getHostels: async (params?: any) => {
    const res = await apiClient.get<HostelsResponse>(
      '/hostels/',
      { params }
    );
    return res.data;
  },

  // Search Hostels
  // GET /hostels/search/
  searchHostels: async (params?: any) => {
    const res = await apiClient.get<HostelsResponse>(
      '/hostels/search/',
      { params }
    );
    return res.data;
  },

  // Create Hostel
  // POST /hostels/create/
  createHostel: async (data: any) => {
    // Ensure base_price is a string for backend Decimal fields
    const formattedData = {
      ...data,
      base_price: data.base_price ? String(data.base_price) : undefined
    };
    
    const res = await apiClient.post<ApiResponse<Hostel>>(
      '/hostels/create/',
      formattedData
    );
    return res.data.data;
  },

  // Get Hostel By ID
  // GET /hostels/{hostel_id}/
  getHostelById: async (id: string | number): Promise<Hostel> => {
    const res = await apiClient.get<Hostel>(
      `/hostels/${id}/`
    );
    if (!res.data) {
        throw new Error('Hostel data not found in response');
    }
    return res.data;
  },

  // Search Room Availability
  // GET /hostels/room-search/
  searchRooms: async (params: {
    query?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    hostel_id?: string;
  }) => {
    const res = await apiClient.get<ApiResponse<Room[]>>( // Assuming list of rooms
      '/hostels/room-search/',
      { params }
    );
    return res.data.data || [];
  },

  // List Rooms (Universal or Hostel specific via filter)
  // GET /hostels/rooms/
  getRooms: async (params?: any) => {
    const res = await apiClient.get<PaginatedResponse<Room>>(
      '/hostels/rooms/',
      { params }
    );
    return res.data;
  },

  // Get Room Details
  // GET /hostels/rooms/{room_id}/
  getRoomById: async (roomId: string) => {
    const res = await apiClient.get<ApiResponse<Room>>(
      `/hostels/rooms/${roomId}/`
    );
    return res.data.data;
  },

  // Create Room
  // POST /hostels/{hostel_id}/rooms/
  createRoom: async (hostelId: string, data: Partial<Room>) => {
    const res = await apiClient.post<ApiResponse<Room>>(
      `/hostels/${hostelId}/rooms/`,
      data
    );
    return res.data.data;
  },

  // Book Room
  // POST /hostels/{room_id}/book/
  bookRoom: async (roomId: string, data: any) => {
    const res = await apiClient.post<ApiResponse<any>>(
      `/hostels/${roomId}/book/`,
      data
    );
    return res.data.data;
  },

  // Reserve Room
  // POST /hostels/{room_id}/reserve/
  reserveRoom: async (roomId: string, data: any) => {
     const res = await apiClient.post<ApiResponse<any>>(
      `/hostels/${roomId}/reserve/`,
      data
    );
    return res.data.data;
  },

  // Get Roommates for a Room
  // GET /hostels/{room_id}/roommates/
  getRoommates: async (roomId: string) => {
    const res = await apiClient.get<ApiResponse<any[]>>( // Returns list of users/profiles
      `/hostels/${roomId}/roommates/`
    );
    return res.data.data;
  },
};

// Aliases for compatibility
export const getHostels = hostelsApi.getHostels;
export const getHostelById = hostelsApi.getHostelById;
export const getHostelBySlug = async (slug: string): Promise<Hostel> => {
  // The backend uses numeric ID as slug fallback, so convert string slug to number
  const hostelId = isNaN(Number(slug)) ? slug : Number(slug);
  
  try {
    return await hostelsApi.getHostelById(hostelId);
  } catch (error) {
    console.error('Failed to fetch hostel by slug:', slug, error);
    throw new Error(`Hostel with slug "${slug}" not found`);
  }
};
export const getHostel = getHostelBySlug; 
export const createHostel = hostelsApi.createHostel;
export const searchRooms = hostelsApi.searchRooms;

export const getRelatedHostels = async (id: string | number): Promise<Hostel[]> => {
  try {
    const res = await apiClient.get<ApiResponse<Hostel[]>>(
      `/hostels/${id}/related/`
    );
    return res.data.data || [];
  } catch (error) {
    console.error('Failed to fetch related hostels:', error);
    return [];
  }
};

export const toggleFavoriteHostel = async (hostelId: string | number) => {
  const res = await apiClient.post<ApiResponse<{ is_favorited: boolean }>>(
    `/hostels/${hostelId}/toggle-favorite/`
  );
  return res.data.data;
};

export const getFavorites = async (): Promise<Hostel[]> => {
  const res = await apiClient.get<ApiResponse<Hostel[]>>(
    '/hostels/favorites/'
  );
  return res.data.data || [];
};

export const searchHostels = hostelsApi.searchHostels;

