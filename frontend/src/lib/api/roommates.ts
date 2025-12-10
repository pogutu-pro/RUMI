import api from './client';
import type { ApiResponse } from '@/types/api.types';
import type { RoommateProfile, RoommateMatch, RoommateRequest } from '@/types/entities.types';

export type RoommateSummary = {
  id: string;
  name: string;
  program: string;
  year: string;
  isPrimaryContact: boolean;
};

/**
 * Get current student's roommates
 * Note: Endpoint /roommates/me/ not explicitly listed in SETUP_GUIDE.md.
 */
const getRoommates = async (): Promise<RoommateSummary[]> => {
  console.warn("getRoommates endpoint /roommates/me/ not found in SETUP_GUIDE.md");
  const response = await api.axios.get<ApiResponse<RoommateSummary[] | undefined>>(
    '/roommates/me/'
  );
  return (response.data.data ?? []) as RoommateSummary[];
};

/**
 * Get roommates for a specific room (Confirmed Endpoint)
 * Endpoint: /api/v1/hostels/{room_id}/roommates/
 */
const getRoommatesForRoom = async (roomId: string): Promise<RoommateMatch[]> => {
  const response = await api.axios.get<ApiResponse<RoommateMatch[]>>(
    `/hostels/${roomId}/roommates/`
  );
  return response.data.data || [];
};

/**
 * Get roommate profile
 * Note: Endpoint /roommates/profile/{id}/ not explicitly listed in SETUP_GUIDE.md.
 */
const getRoommateProfile = async (roommateId: string): Promise<RoommateProfile> => {
   console.warn("getRoommateProfile endpoint not found in SETUP_GUIDE.md");
  const response = await api.axios.get<ApiResponse<RoommateProfile>>(
    `/roommates/profile/${roommateId}/`
  );
  if (!response.data.data) {
    throw new Error('Roommate profile not found');
  }
  return response.data.data;
};

/**
 * Get roommate matches (potential roommates)
 * Note: Endpoint /roommates/matches/ not explicitly listed in SETUP_GUIDE.md.
 */
const getRoommateMatches = async (): Promise<RoommateMatch[]> => {
  console.warn("getRoommateMatches endpoint not found in SETUP_GUIDE.md");
  const response = await api.axios.get<ApiResponse<RoommateMatch[]>>(
    '/roommates/matches/'
  );
  return response.data.data || [];
};

/**
 * Get roommate requests (sent and received)
 * Note: Endpoint /roommates/requests/ not explicitly listed in SETUP_GUIDE.md.
 */
const getRoommateRequests = async (): Promise<RoommateRequest[]> => {
  console.warn("getRoommateRequests endpoint not found in SETUP_GUIDE.md");
  const response = await api.axios.get<ApiResponse<RoommateRequest[]>>(
    '/roommates/requests/'
  );
  return response.data.data || [];
};

/**
 * Send a roommate request
 * Note: Endpoint /roommates/requests/ not explicitly listed in SETUP_GUIDE.md.
 */
const sendRoommateRequest = async (
  userId: string,
  message?: string
): Promise<RoommateRequest> => {
  console.warn("sendRoommateRequest endpoint not found in SETUP_GUIDE.md");
  const response = await api.axios.post<ApiResponse<RoommateRequest>>(
    '/roommates/requests/',
    { toUserId: userId, message }
  );
  if (!response.data.data) {
    throw new Error('Failed to send roommate request');
  }
  return response.data.data;
};

/**
 * Respond to a roommate request
 * Note: Endpoint /roommates/requests/{id}/respond/ not explicitly listed in SETUP_GUIDE.md.
 */
const respondToRequest = async (
  requestId: string,
  accept: boolean
): Promise<void> => {
  console.warn("respondToRequest endpoint not found in SETUP_GUIDE.md");
  await api.axios.post(`/roommates/requests/${requestId}/respond/`, {
    status: accept ? 'accepted' : 'rejected',
  });
};

/**
 * Update roommate preferences
 * Note: Endpoint /roommates/preferences/ not explicitly listed in SETUP_GUIDE.md.
 */
const updatePreferences = async (preferences: any): Promise<RoommateProfile> => {
  console.warn("updatePreferences endpoint not found in SETUP_GUIDE.md");
  const response = await api.axios.patch<ApiResponse<RoommateProfile>>(
    '/roommates/preferences/',
    { preferences }
  );
  if (!response.data.data) {
    throw new Error('Failed to update preferences');
  }
  return response.data.data;
};

/**
 * Remove a roommate
 * Note: Endpoint /roommates/{id}/ not explicitly listed in SETUP_GUIDE.md.
 */
const removeRoommate = async (roommateId: string): Promise<void> => {
  console.warn("removeRoommate endpoint not found in SETUP_GUIDE.md");
  await api.axios.delete(`/roommates/${roommateId}/`);
};

export const roommatesApi = {
  getRoommates,
  getRoommatesForRoom,
  getRoommateProfile,
  getRoommateMatches,
  getRoommateRequests,
  sendRoommateRequest,
  respondToRequest,
  updatePreferences,
  removeRoommate,
};
