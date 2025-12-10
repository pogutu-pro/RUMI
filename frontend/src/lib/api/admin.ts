import api from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { User } from '@/types/auth.types';

export interface AdminUserFilters extends PaginationParams {
  role?: string;
  status?: 'active' | 'inactive';
  search?: string;
}

export interface Caretaker {
  id: string;
  userId: string;
  hostelId: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export const getUsers = async (filters?: AdminUserFilters) => {
  const response = await api.axios.get<PaginatedResponse<User>>('/accounts/users/', { params: filters });
  return response.data;
};

export const deactivateUser = async (userId: string) => {
  const response = await api.axios.post<ApiResponse<any>>(`/accounts/users/${userId}/deactivate/`);
  return response.data.data;
};

export const reactivateUser = async (userId: string) => {
  const response = await api.axios.post<ApiResponse<any>>(`/accounts/users/${userId}/reactivate/`);
  return response.data.data;
};

export const getUserActivity = async (userId: string) => {
  const response = await api.axios.get<ApiResponse<any[]>>(`/accounts/users/${userId}/activity/`);
  return response.data.data || [];
};

// Caretaker Management
export const getCaretakers = async () => {
  const response = await api.axios.get<ApiResponse<Caretaker[]>>('/accounts/caretakers/');
  return response.data.data || [];
};

export const createCaretaker = async (data: Partial<Caretaker>) => {
  const response = await api.axios.post<ApiResponse<Caretaker>>('/accounts/caretakers/', data);
  if (!response.data.data) throw new Error('Failed to create caretaker');
  return response.data.data;
};

export const getCaretaker = async (id: string) => {
  const response = await api.axios.get<ApiResponse<Caretaker>>(`/accounts/caretakers/${id}/`);
  if (!response.data.data) throw new Error('Caretaker not found');
  return response.data.data;
};

// Landlord Verification
export const getLandlordApplications = async () => {
  const response = await api.axios.get<ApiResponse<any[]>>('/accounts/landlords/verification/');
  return response.data.data || [];
};

export const verifyLandlord = async (id: string, action: 'approve' | 'reject') => {
  const response = await api.axios.post<ApiResponse<any>>(`/accounts/landlords/${id}/verify/${action}/`);
  return response.data.data;
};

