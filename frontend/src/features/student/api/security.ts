import apiClient from '@/lib/api/client';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { ID, Timestamp } from '@/features/auth/types/types';

// Types
export interface LateEntryLog {
  id: ID;
  tenantId: ID;
  tenantName: string;
  roomNumber: string;
  entryTime: Timestamp;
  reason?: string;
  loggedBy: ID;
  loggedByName: string;
  notes?: string;
  createdAt: Timestamp;
  status: 'pending' | 'acknowledged';
}

export interface VisitorInvitation {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber: string;
  expectedArrivalTime: string;
  purpose: string;
  durationHours: number;
  status: 'pending' | 'checked_in' | 'checked_out' | 'expired';
  studentName: string;
  roomNumber: string;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface CreateVisitorInvitationRequest {
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber: string;
  expectedArrivalTime: string;
  purpose: string;
  durationHours: number;
}

// API Service
export const studentSecurityApi = {
  // Get My Late Entries
  // GET /api/v1/student/security/late-entries/
  getMyLateEntries: async (params?: any) => {
    const res = await apiClient.get<PaginatedResponse<LateEntryLog>>(
      '/student/security/late-entries/',
      { params }
    );
    return res.data.data;
  },

  // Get My Visitor Invitations
  // GET /api/v1/student/security/visitor-invitations/
  getMyVisitorInvitations: async (params?: any) => {
    const res = await apiClient.get<PaginatedResponse<VisitorInvitation>>(
      '/student/security/visitor-invitations/',
      { params }
    );
    return res.data.data;
  },

  // Create Visitor Invitation
  // POST /api/v1/student/security/visitor-invitations/
  createVisitorInvitation: async (data: CreateVisitorInvitationRequest) => {
    const res = await apiClient.post<ApiResponse<VisitorInvitation>>(
      '/student/security/visitor-invitations/',
      data
    );
    return res.data.data;
  },

  // Acknowledge Late Entry
  // POST /api/v1/student/security/late-entries/{id}/acknowledge/
  acknowledgeLateEntry: async (id: string) => {
    const res = await apiClient.post<ApiResponse<LateEntryLog>>(
      `/student/security/late-entries/${id}/acknowledge/`
    );
    return res.data.data;
  },
};
