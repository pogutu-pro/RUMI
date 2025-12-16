import { axiosInstance as axios } from '@/lib/api/client';
import { csrf } from '@/lib/security/csrf';
import type { ApiResponse } from '@/types/api.types';

/**
 * Caretaker permissions structure
 */
export interface CaretakerPermissions {
  canManageInventory: boolean;
  canHandleReports: boolean;
  canViewPayments: boolean;
  canManageBookings: boolean;
  canCommunicateWithTenants: boolean;
}

/**
 * Caretaker data structure
 */
export interface LandlordCaretaker {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hostelId: string;
  hostelName: string;
  permissions: CaretakerPermissions;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Performance Metrics
  rating?: number;
  tasksCompleted?: number;
  responseTime?: number; // in minutes
  occupancyRate?: number; // percentage
}

/**
 * Request payload for creating a caretaker
 */
export interface CreateCaretakerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hostelId: string;
  permissions?: Partial<CaretakerPermissions>;
  sendInvitationEmail?: boolean;
}

/**
 * Request payload for updating a caretaker
 */
export interface UpdateCaretakerRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  hostelId?: string;
  permissions?: Partial<CaretakerPermissions>;
  isActive?: boolean;
}

/**
 * Get all caretakers for the logged-in landlord
 * Endpoint: GET /api/v1/accounts/caretakers/
 * NOTE: Backend automatically filters by logged-in landlord
 */
export const getMyCaretakers = async (): Promise<LandlordCaretaker[]> => {
  const res = await axios.get<ApiResponse<LandlordCaretaker[]>>(
    '/accounts/caretakers/'
  );
  return res.data.data || [];
};

/**
 * Create a new caretaker account
 * Endpoint: POST /api/v1/accounts/caretakers/
 */
export const createCaretaker = async (
  data: CreateCaretakerRequest
): Promise<LandlordCaretaker> => {
  const res = await axios.post<ApiResponse<LandlordCaretaker>>(
    '/accounts/caretakers/',
    data,
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to create caretaker');
  }
  return res.data.data;
};

/**
 * Get a specific caretaker by ID
 * Endpoint: GET /api/v1/accounts/caretakers/:id/
 */
export const getCaretaker = async (id: string): Promise<LandlordCaretaker> => {
  const res = await axios.get<ApiResponse<LandlordCaretaker>>(
    `/accounts/caretakers/${id}/`
  );
  if (!res.data.data) {
    throw new Error('Caretaker not found');
  }
  return res.data.data;
};

/**
 * Update caretaker details
 * Endpoint: PUT /api/v1/accounts/caretakers/:id/
 * NOTE: Backend uses PUT (full replacement) not PATCH. Send complete object.
 */
export const updateCaretaker = async (
  id: string,
  data: UpdateCaretakerRequest
): Promise<LandlordCaretaker> => {
  const res = await axios.put<ApiResponse<LandlordCaretaker>>(
    `/accounts/caretakers/${id}/`,
    data,
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to update caretaker');
  }
  return res.data.data;
};

/**
 * Delete/deactivate a caretaker
 * Endpoint: DELETE /api/v1/accounts/caretakers/:id/
 */
export const deleteCaretaker = async (id: string): Promise<void> => {
  await axios.delete(`/accounts/caretakers/${id}/`, {
    headers: csrf.getHeader(),
  });
};

export const landlordCaretakersApi = {
  getMyCaretakers,
  createCaretaker,
  getCaretaker,
  updateCaretaker,
  deleteCaretaker,
};
