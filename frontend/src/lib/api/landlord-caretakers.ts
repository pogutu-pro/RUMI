import { axiosInstance as axios } from './client';
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
 * Endpoint: GET /api/v1/landlord/caretakers/
 */
export const getMyCaretakers = async (): Promise<LandlordCaretaker[]> => {
  const res = await axios.get<ApiResponse<LandlordCaretaker[]>>(
    '/landlord/caretakers/'
  );
  return res.data.data || [];
};

/**
 * Create a new caretaker account
 * Endpoint: POST /api/v1/landlord/caretakers/
 */
export const createCaretaker = async (
  data: CreateCaretakerRequest
): Promise<LandlordCaretaker> => {
  const res = await axios.post<ApiResponse<LandlordCaretaker>>(
    '/landlord/caretakers/',
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
 * Endpoint: GET /api/v1/landlord/caretakers/:id/
 */
export const getCaretaker = async (id: string): Promise<LandlordCaretaker> => {
  const res = await axios.get<ApiResponse<LandlordCaretaker>>(
    `/landlord/caretakers/${id}/`
  );
  if (!res.data.data) {
    throw new Error('Caretaker not found');
  }
  return res.data.data;
};

/**
 * Update caretaker details
 * Endpoint: PATCH /api/v1/landlord/caretakers/:id/
 */
export const updateCaretaker = async (
  id: string,
  data: UpdateCaretakerRequest
): Promise<LandlordCaretaker> => {
  const res = await axios.patch<ApiResponse<LandlordCaretaker>>(
    `/landlord/caretakers/${id}/`,
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
 * Endpoint: DELETE /api/v1/landlord/caretakers/:id/
 */
export const deleteCaretaker = async (id: string): Promise<void> => {
  await axios.delete(`/landlord/caretakers/${id}/`, {
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
