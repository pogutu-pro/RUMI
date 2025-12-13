import apiClient from '@/lib/api/client';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { User } from '@/features/users';

// -- Types --

export interface Caretaker extends User {
  // specific caretaker fields if any, extending base User
  assignedProperties?: number;
}

export interface CreateCaretakerRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password?: string; // Optional if generated or handled via invite
}

export interface UpdateCaretakerRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

// -- API Service --

export const caretakersApi = {
  // List Caretakers
  // GET /accounts/caretakers/
  getCaretakers: async (params?: any) => {
    const res = await apiClient.get<PaginatedResponse<Caretaker>>(
      '/accounts/caretakers/',
      { params }
    );
    return res.data;
  },

  // Create Caretaker
  // POST /accounts/caretakers/
  createCaretaker: async (data: CreateCaretakerRequest) => {
    const res = await apiClient.post<ApiResponse<Caretaker>>(
      '/accounts/caretakers/',
      data
    );
    return res.data;
  },

  // Update Caretaker
  // PUT /accounts/caretakers/{caretaker_id}/
  updateCaretaker: async (id: string, data: UpdateCaretakerRequest) => {
    const res = await apiClient.put<ApiResponse<Caretaker>>(
      `/accounts/caretakers/${id}/`,
      data
    );
    return res.data;
  },

  // Delete Caretaker
  // DELETE /accounts/caretakers/{caretaker_id}/
  deleteCaretaker: async (id: string) => {
    await apiClient.delete(`/accounts/caretakers/${id}/`);
  },
};
