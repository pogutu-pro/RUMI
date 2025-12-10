import api from './client';
import type { ApiResponse } from '@/types/api.types';

export interface InventoryItem {
  id: string;
  name: string;
  condition: 'good' | 'fair' | 'poor' | 'damaged' | 'missing';
  notes?: string;
}

export interface InventoryTemplate {
  id: string;
  hostelId: string;
  items: InventoryItem[];
}

export interface CheckIn {
  id: string;
  bookingId: string;
  status: 'pending' | 'submitted' | 'verified';
  items: InventoryItem[];
}

export const createInventoryTemplate = async (hostelId: string, items: Omit<InventoryItem, 'id'>[]): Promise<InventoryTemplate> => {
  const response = await api.axios.post<ApiResponse<InventoryTemplate>>(`/hostels/${hostelId}/inventory/`, { items });
  if (!response.data.data) throw new Error('Failed to create inventory template');
  return response.data.data;
};

export const getInventoryTemplate = async (hostelId: string): Promise<InventoryTemplate> => {
  const response = await api.axios.get<ApiResponse<InventoryTemplate>>(`/hostels/${hostelId}/inventory/template/`);
  if (!response.data.data) throw new Error('Inventory template not found');
  return response.data.data;
};

export const startCheckIn = async (bookingId: string): Promise<CheckIn> => {
  const response = await api.axios.post<ApiResponse<CheckIn>>(`/hostels/checkin/${bookingId}/start/`);
  if (!response.data.data) throw new Error('Failed to start check-in');
  return response.data.data;
};

export const submitCheckIn = async (checkInId: string, items: InventoryItem[]): Promise<CheckIn> => {
  const response = await api.axios.put<ApiResponse<CheckIn>>(`/hostels/checkin/${checkInId}/submit/`, { items });
  if (!response.data.data) throw new Error('Failed to submit check-in');
  return response.data.data;
};

export const verifyCheckIn = async (checkInId: string, verified: boolean, notes?: string): Promise<CheckIn> => {
  const response = await api.axios.put<ApiResponse<CheckIn>>(`/hostels/checkin/${checkInId}/verify/`, { verified, notes });
  if (!response.data.data) throw new Error('Failed to verify check-in');
  return response.data.data;
};
