import { axiosInstance as axios } from '@/lib/api/client';
import { csrf } from '@/lib/security/csrf';
import type { ApiResponse } from '@/types/api.types';

/**
 * Visitor invitation structure (student-created, caretaker-managed)
 */
export interface VisitorInvitation {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  purpose: string;
  expectedArrivalTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out' | 'expired';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  checkedOutAt?: string;
  checkedOutBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Roommate matching request structure
 */
export interface RoommateRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRoom: string;
  requesteeId: string;
  requesteeName: string;
  requesteeRoom: string;
  hostelId: string;
  hostelName: string;
  matchScore: number; // 0-100
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestReason: string;
  preferences: {
    studyHabits?: string;
    sleepSchedule?: string;
    cleanliness?: string;
    socialLevel?: string;
  };
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Approval request structure (multi-purpose approvals)
 */
export interface ApprovalRequest {
  id: string;
  type: 'check_in' | 'maintenance' | 'access_request' | 'guest_extension' | 'room_change' | 'other';
  requesterId: string;
  requesterName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected';
  metadata?: Record<string, any>;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all visitor invitations for caretaker's hostel
 * Endpoint: GET /api/v1/caretaker/visitor-invitations/
 */
export const getVisitorInvitations = async (): Promise<VisitorInvitation[]> => {
  const res = await axios.get<ApiResponse<VisitorInvitation[]>>('/caretaker/visitor-invitations/');
  return res.data.data || [];
};

/**
 * Approve visitor invitation
 * Endpoint: POST /api/v1/caretaker/visitor-invitations/:id/approve/
 */
export const approveVisitorInvitation = async (id: string): Promise<VisitorInvitation> => {
  const res = await axios.post<ApiResponse<VisitorInvitation>>(
    `/caretaker/visitor-invitations/${id}/approve/`,
    {},
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to approve visitor invitation');
  }
  return res.data.data;
};

/**
 * Reject visitor invitation
 * Endpoint: POST /api/v1/caretaker/visitor-invitations/:id/reject/
 */
export const rejectVisitorInvitation = async (id: string, reason: string): Promise<VisitorInvitation> => {
  const res = await axios.post<ApiResponse<VisitorInvitation>>(
    `/caretaker/visitor-invitations/${id}/reject/`,
    { reason },
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to reject visitor invitation');
  }
  return res.data.data;
};

/**
 * Check in visitor
 * Endpoint: POST /api/v1/caretaker/visitor-invitations/:id/check-in/
 */
export const checkInVisitor = async (id: string): Promise<VisitorInvitation> => {
  const res = await axios.post<ApiResponse<VisitorInvitation>>(
    `/caretaker/visitor-invitations/${id}/check-in/`,
    { timeIn: new Date().toISOString() },
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to check in visitor');
  }
  return res.data.data;
};

/**
 * Check out visitor
 * Endpoint: POST /api/v1/caretaker/visitor-invitations/:id/check-out/
 */
export const checkOutVisitor = async (id: string): Promise<VisitorInvitation> => {
  const res = await axios.post<ApiResponse<VisitorInvitation>>(
    `/caretaker/visitor-invitations/${id}/check-out/`,
    { timeOut: new Date().toISOString() },
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to check out visitor');
  }
  return res.data.data;
};

/**
 * Get all roommate requests
 * Endpoint: GET /api/v1/caretaker/roommate-requests/
 */
export const getRoommateRequests = async (): Promise<RoommateRequest[]> => {
  const res = await axios.get<ApiResponse<RoommateRequest[]>>('/caretaker/roommate-requests/');
  return res.data.data || [];
};

/**
 * Approve roommate request
 * Endpoint: POST /api/v1/caretaker/roommate-requests/:id/approve/
 */
export const approveRoommateRequest = async (id: string): Promise<RoommateRequest> => {
  const res = await axios.post<ApiResponse<RoommateRequest>>(
    `/caretaker/roommate-requests/${id}/approve/`,
    {},
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to approve roommate request');
  }
  return res.data.data;
};

/**
 * Reject roommate request
 * Endpoint: POST /api/v1/caretaker/roommate-requests/:id/reject/
 */
export const rejectRoommateRequest = async (id: string, reason: string): Promise<RoommateRequest> => {
  const res = await axios.post<ApiResponse<RoommateRequest>>(
    `/caretaker/roommate-requests/${id}/reject/`,
    { reason },
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to reject roommate request');
  }
  return res.data.data;
};

/**
 * Get all approval requests
 * Endpoint: GET /api/v1/caretaker/approvals/
 */
export const getApprovalRequests = async (): Promise<ApprovalRequest[]> => {
  const res = await axios.get<ApiResponse<ApprovalRequest[]>>('/caretaker/approvals/');
  return res.data.data || [];
};

/**
 * Approve request
 * Endpoint: POST /api/v1/caretaker/approvals/:id/approve/
 */
export const approveRequest = async (id: string, notes?: string): Promise<ApprovalRequest> => {
  const res = await axios.post<ApiResponse<ApprovalRequest>>(
    `/caretaker/approvals/${id}/approve/`,
    { notes },
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to approve request');
  }
  return res.data.data;
};

/**
 * Reject request
 * Endpoint: POST /api/v1/caretaker/approvals/:id/reject/
 */
export const rejectRequest = async (id: string, reason: string): Promise<ApprovalRequest> => {
  const res = await axios.post<ApiResponse<ApprovalRequest>>(
    `/caretaker/approvals/${id}/reject/`,
    { reason },
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to reject request');
  }
  return res.data.data;
};

export const caretakerWorkflowsApi = {
  getVisitorInvitations,
  approveVisitorInvitation,
  rejectVisitorInvitation,
  checkInVisitor,
  checkOutVisitor,
  getRoommateRequests,
  approveRoommateRequest,
  rejectRoommateRequest,
  getApprovalRequests,
  approveRequest,
  rejectRequest,
};
