import apiClient from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

// -- Types --

export interface Checkin {
  id: string;
  bookingId: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'verified' | 'completed';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  photos?: string[];
}

export interface CheckinSubmitRequest {
  checklist: Record<string, boolean>; // e.g. {"keys_received": true}
  notes?: string;
  photos?: File[]; // To be handled via FormData
}

export interface CheckinVerifyRequest {
  verified: boolean;
  notes?: string;
}

// -- API Service --

export const checkinApi = {
  // Start Check-in
  // POST /hostels/checkin/{booking_id}/start/
  startCheckin: async (bookingId: string) => {
    const res = await apiClient.post<ApiResponse<Checkin>>(
      `/hostels/checkin/${bookingId}/start/`
    );
    return res.data.data;
  },

  // Submit Check-in
  // PUT /hostels/checkin/{checkin_id}/submit/
  submitCheckin: async (checkinId: string, data: CheckinSubmitRequest) => {
    // Handle photo upload if necessary
    // Assuming simple JSON for now, or FormData if photos present
    // Implementation for FormData:
    /*
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
         if (key === 'photos' && Array.isArray(value)) {
             value.forEach(file => formData.append('photos', file));
         } else {
             formData.append(key, String(value));
         }
    });
    const res = await apiClient.put(..., formData, { headers: { 'Content-Type': 'multipart/form-data' }});
    */
   
    const res = await apiClient.put<ApiResponse<Checkin>>(
      `/hostels/checkin/${checkinId}/submit/`,
      data
    );
    return res.data.data;
  },

  // Verify Check-in (Landlord/Caretaker)
  // PUT /hostels/checkin/{checkin_id}/verify/
  verifyCheckin: async (checkinId: string, data: CheckinVerifyRequest) => {
    const res = await apiClient.put<ApiResponse<Checkin>>(
      `/hostels/checkin/${checkinId}/verify/`,
      data
    );
    return res.data.data;
  },
};
