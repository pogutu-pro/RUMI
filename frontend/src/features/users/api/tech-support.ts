import apiClient from '@/lib/api/client';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { User } from '../types';

export interface TechSupportUser extends User {
  // Add specific fields if any
}

export const techSupportApi = {
  // List Tech Support Users
  // GET /support/tech-support/
  getAll: async (params?: any) => {
    const res = await apiClient.get<PaginatedResponse<TechSupportUser>>(
      '/support/tech-support/',
      { params }
    );
    return res.data;
  },

  // Create Tech Support User
  // POST /support/tech-support/
  create: async (data: any) => {
    const res = await apiClient.post<ApiResponse<TechSupportUser>>(
      '/support/tech-support/',
      data
    );
    return res.data;
  },
};
