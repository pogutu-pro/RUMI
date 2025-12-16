import apiClient from '@/lib/api/client';
import { User } from '@/features/users'; // Assuming types exist or will be added
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

// -- Types --
// If UserActivity is not defined in features/users, define it here or in a types file.
// For now, I'll export it here if missing.

export interface UserActivity {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  ip_address?: string;
}

export interface LandlordVerificationRequest {
  documentType?: string;
  notes?: string;
}

// -- API Service --

export const usersApi = {
  // List Users (Admin/System)
  // GET /accounts/users/
  getUsers: async (params?: any) => {
    const res = await apiClient.get<PaginatedResponse<User>>(
      '/accounts/users/',
      { params }
    );
    return res.data; // Adapting to PaginatedResponse return shape
  },

  // Get User Activity
  // GET /accounts/users/{user_id}/activity/
  getUserActivity: async (userId: string, params?: any) => {
    const res = await apiClient.get<PaginatedResponse<UserActivity>>(
      `/accounts/users/${userId}/activity/`,
      { params }
    );
    return res.data;
  },

  // Deactivate User
  // PUT /accounts/users/{user_id}/deactivate/
  deactivateUser: async (userId: string, reason?: string) => {
    const res = await apiClient.put<ApiResponse<User>>(
      `/accounts/users/${userId}/deactivate/`,
      { reason }
    );
    return res.data;
  },

  // Reactivate User
  // PUT /accounts/users/{user_id}/reactivate/
  reactivateUser: async (userId: string, reason?: string) => {
    const res = await apiClient.put<ApiResponse<User>>(
      `/accounts/users/${userId}/reactivate/`,
      { reason }
    );
    return res.data;
  },

  // -- Landlord Verification (can be here or in landlord feature) --
  // GET /accounts/landlords/verification/
  getLandlordVerifications: async (params?: any) => {
    const res = await apiClient.get<PaginatedResponse<any>>( // Replace 'any' with VerificationRequestType
      '/accounts/landlords/verification/',
      { params }
    );
    return res.data;
  },

  // Verify Landlord Action
  // POST /accounts/landlords/{landlord_id}/verify/{action}/
  verifyLandlord: async (landlordId: string, action: 'approve' | 'reject', data?: LandlordVerificationRequest) => {
    const res = await apiClient.post<ApiResponse<any>>(
      `/accounts/landlords/${landlordId}/verify/${action}/`,
      data
    );
    return res.data;
  },
};

// Aliases for compatibility if needed, but direct usage of usersApi is preferred.
export const getUsers = async (params?: any) => {
  const data = await usersApi.getUsers(params);
  return data.data; // Adapter for legacy expectations if they expected just an array
};

export const getUserById = async (id: string): Promise<User> => {
    // Relying on standard REST endpoint /accounts/users/{id}/
    const res = await apiClient.get<ApiResponse<User>>(`/accounts/users/${id}/`);
    return res.data.data!;
};

export const getUser = getUserById;

export const deleteUser = async (userId: string) => {
    return usersApi.deactivateUser(userId, 'Deleted by admin');
};

export const updateUserStatus = async (userId: string, data: { status: string; reason?: string }) => {
    if (data.status === 'active') {
        return usersApi.reactivateUser(userId, data.reason);
    } else {
        return usersApi.deactivateUser(userId, data.reason);
    }
};

