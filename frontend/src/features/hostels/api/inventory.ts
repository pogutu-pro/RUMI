import apiClient from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

// -- Types --

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  condition: string;
  hostelId: string;
}

export interface InventoryTemplate {
  category: string;
  items: string[];
}

// -- API Service --

export const inventoryApi = {
  // Create Inventory Item
  // POST /hostels/{hostel_id}/inventory/
  createInventoryItem: async (hostelId: string, data: Partial<InventoryItem>) => {
    const res = await apiClient.post<ApiResponse<InventoryItem>>(
      `/hostels/${hostelId}/inventory/`,
      data
    );
    return res.data.data;
  },

  // Get Inventory Template
  // GET /hostels/{hostel_id}/inventory/template/
  getInventoryTemplate: async (hostelId: string) => {
    const res = await apiClient.get<ApiResponse<InventoryTemplate[]>>(
      `/hostels/${hostelId}/inventory/template/`
    );
    return res.data.data;
  },
};
