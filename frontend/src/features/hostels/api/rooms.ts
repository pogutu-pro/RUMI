import api from '@/lib/api/client';
import type { Room } from '@/types/entities.types';
import type { ApiResponse } from '@/types/api.types';

export const getRooms = async (hostelId?: string): Promise<Room[]> => {
  const url = hostelId ? `/hostels/${hostelId}/rooms/` : '/hostels/rooms/';
  const response = await api.axios.get<ApiResponse<Room[]>>(url);
  return response.data.data || [];
};

export const getRoomById = async (roomId: string): Promise<Room> => {
  const response = await api.axios.get<ApiResponse<Room>>(`/hostels/rooms/${roomId}/`);
  if (!response.data.data) {
    throw new Error('Room not found');
  }
  return response.data.data;
};

export const createRoom = async (hostelId: string, data: Partial<Room>): Promise<Room> => {
  const response = await api.axios.post<ApiResponse<Room>>(`/hostels/${hostelId}/rooms/`, data);
  if (!response.data.data) {
    throw new Error('Failed to create room');
  }
  return response.data.data;
};

export const reserveRoom = async (roomId: string, data: { checkIn: string; checkOut: string }): Promise<any> => {
  const response = await api.axios.post<ApiResponse<any>>(`/hostels/${roomId}/reserve/`, data);
  return response.data.data || {};
};

export const bookRoom = async (roomId: string, data: { checkIn: string; checkOut: string; guests: number }): Promise<any> => {
  const response = await api.axios.post<ApiResponse<any>>(`/hostels/${roomId}/book/`, data);
  return response.data.data || {};
};

export const getRoommates = async (roomId: string): Promise<any[]> => {
  const response = await api.axios.get<ApiResponse<any[]>>(`/hostels/${roomId}/roommates/`);
  return response.data.data || [];
};

export const updateRoom = async (hostelId: string, roomId: string, data: Partial<Room>): Promise<Room> => {
  const response = await api.axios.patch<ApiResponse<Room>>(`/hostels/${hostelId}/rooms/${roomId}/`, data);
  if (!response.data.data) {
    throw new Error('Failed to update room');
  }
  return response.data.data;
};

export const deleteRoom = async (hostelId: string, roomId: string): Promise<void> => {
  await api.axios.delete(`/hostels/${hostelId}/rooms/${roomId}/`);
};

