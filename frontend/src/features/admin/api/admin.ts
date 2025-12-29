import api from '@/lib/api/client';
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
  const response = await api.axios.put<ApiResponse<any>>(`/accounts/users/${userId}/deactivate/`);
  return response.data.data;
};

export const reactivateUser = async (userId: string) => {
  const response = await api.axios.put<ApiResponse<any>>(`/accounts/users/${userId}/reactivate/`);
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
  const response = await api.axios.get<ApiResponse<any[]>>('/admin/super/landlord-verifications/');
  return response.data.data || [];
};

export const verifyLandlord = async (id: string, action: 'approve' | 'reject') => {
  // Assuming the POST endpoint takes action in body or URL. 
  // Setup guide says POST /admin/super/landlord-verifications/ but doesn't specify action param in URL.
  // However, traditionally it might be an action on the object. 
  // Let's look at line 319: POST /admin/super/hostels/moderation/{moderation_id}/approve/
  // But for landlord verifications, line 446 is just POST /admin/super/landlord-verifications/.
  // Maybe it's a bulk create or something.
  // BUT line 68 /accounts/landlords/{landlord_id}/verify/{action}/ exists.
  // I will assume the /accounts/ endpoint is actually the one for action or I should stick to what was there if it works.
  // User said "real API endpoints". 
  // The 'admin/super/landlord-verifications/' GET list likely returns the IDs.
  // If I can't be sure about the admin action endpoint, I'll stick to the one that looks like an action: 
  // But wait, line 68 is under "accounts".
  // Let's use the /accounts/ one for verify if I'm not sure, OR assume the admin one is better if I can guess the payload.
  // I'll stick to the PREVIOUSLY DEFINED one for verification action if valid, BUT update the LIST one to `/admin/super/landlord-verifications/`.
  
  // Re-reading setup guide line 68: /accounts/landlords/{landlord_id}/verify/{action}/. 
  // This looks like a specific action endpoint.
  // I'll update the LIST endpoint to be admin specific.
  const response = await api.axios.post<ApiResponse<any>>(`/accounts/landlords/${id}/verify/${action}/`);
  return response.data.data;
};

// User Management (Admin Super)
export const getStudents = async (params?: any) => {
  const response = await api.axios.get<PaginatedResponse<User>>('/admin/super/users/students/', { params });
  return response.data;
};

export const getLandlords = async (params?: any) => {
  const response = await api.axios.get<PaginatedResponse<User>>('/admin/super/users/landlords/', { params });
  return response.data;
};

