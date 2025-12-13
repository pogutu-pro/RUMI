import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';
import {
  TransferRequest,
  AvailableRoom,
  TransferPolicy,
  TransferReason,
} from '@/types/entities.types';
import { FilterRoomsInput } from '@/lib/validations/transfer.schema';

/**
 * Get user's transfer history for a specific hostel
 */
export const getMyTransfers = async (hostelId: string): Promise<TransferRequest[]> => {
  const response = await apiClient.axios.get<ApiResponse<TransferRequest[]>>(`/hostels/${hostelId}/transfers/my-transfers/`);
  return response.data.data || [];
};

/**
 * Get available rooms for transfer in a specific hostel
 */
export const getAvailableRooms = async (
  hostelId: string,
  filters?: FilterRoomsInput
): Promise<AvailableRoom[]> => {
  const response = await apiClient.axios.get<ApiResponse<AvailableRoom[]>>(`/hostels/${hostelId}/transfers/available-rooms/`, { params: filters });
  return response.data.data || [];
};

/**
 * Get transfer policy for a specific hostel
 */
export const getTransferPolicy = async (hostelId: string): Promise<TransferPolicy> => {
  const response = await apiClient.axios.get<ApiResponse<TransferPolicy>>(`/hostels/${hostelId}/transfer-policy/`);
  if (!response.data.data) throw new Error('Policy not found');
  return response.data.data;
};

/**
 * Create a new transfer request
 */
export const createTransferRequest = async (
  hostelId: string,
  data: {
    bookingId: string;
    fromRoomId: string;
    toRoomId: string;
    reason: TransferReason;
    reasonDetails?: string;
    transferDate: Date;
  }
): Promise<TransferRequest> => {
  const response = await apiClient.axios.post<ApiResponse<TransferRequest>>(`/hostels/${hostelId}/transfers/request/`, data);
  if (!response.data.data) throw new Error('Failed to create transfer request');
  return response.data.data;
};

/**
 * Cancel a pending transfer request
 */
export const cancelTransferRequest = async (
  hostelId: string,
  transferId: string
): Promise<void> => {
  await apiClient.axios.delete(`/hostels/${hostelId}/transfers/${transferId}/cancel/`);
};

/**
 * Helper to update transfer status (mostly for admin/caretaker, but kept here if used)
 */
export const updateTransferStatus = async (
  id: string,
  status: TransferRequest['status']
): Promise<void> => {
    await apiClient.axios.patch(`/transfers/${id}/status/`, { status });
};
