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

/**
 * ================================================================================
 * README: Admin API Module (admin.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Provides admin-level API functions for user management, caretaker management,
 * and landlord verification. Requires admin authentication.
 *
 * BACKEND ENDPOINTS:
 * ------------------
 * | Method | Endpoint                              | Function              |
 * |--------|---------------------------------------|----------------------|
 * | GET    | /accounts/users/                      | getUsers()           |
 * | POST   | /accounts/users/{id}/deactivate/      | deactivateUser()     |
 * | POST   | /accounts/users/{id}/reactivate/      | reactivateUser()     |
 * | GET    | /accounts/users/{id}/activity/        | getUserActivity()    |
 * | GET    | /accounts/caretakers/                 | getCaretakers()      |
 * | POST   | /accounts/caretakers/                 | createCaretaker()    |
 * | GET    | /accounts/caretakers/{id}/            | getCaretaker()       |
 * | GET    | /accounts/landlords/verification/     | getLandlordApplications()|
 * | POST   | /accounts/landlords/{id}/verify/...   | verifyLandlord()     |
 *
 * FEATURES:
 * ---------
 * - User Management: List, filter, activate/deactivate users
 * - Caretaker Management: Create and manage caretaker accounts
 * - Landlord Verification: Approve/reject landlord applications
 *
 * USAGE EXAMPLES:
 * ---------------
 * ```typescript
 * import { getUsers, deactivateUser, verifyLandlord } from './admin';
 *
 * // List users with filters
 * const users = await getUsers({ role: 'student', status: 'active' });
 *
 * // Deactivate user
 * await deactivateUser('user-123');
 *
 * // Verify landlord
 * await verifyLandlord('landlord-123', 'approve');
 * ```
 *
 * ================================================================================
 */
