import { axiosInstance as axios } from '@/lib/api/client';
import { csrf } from '@/lib/security/csrf';
import type { ApiResponse } from '@/types/api.types';

/**
 * Admin activity feed item structure
 */
export interface AdminActivity {
  id: string;
  type: 'booking' | 'payment' | 'user_registration' | 'verification_request' | 'maintenance' | 'system';
  title: string;
  description: string;
  time: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Get admin activity feed
 * Endpoint: GET /api/v1/admin/activity-feed/
 */
export const getAdminActivityFeed = async (limit = 10): Promise<AdminActivity[]> => {
  const res = await axios.get<ApiResponse<AdminActivity[]>>('/admin/activity-feed/', {
    params: { limit },
  });
  return res.data.data || [];
};

/**
 * Payment dispute structure
 */
export interface PaymentDispute {
  id: string;
  disputeId: string;
  userId: string;
  userName: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  resolvedAt?: string;
  resolverNotes?: string;
  evidence?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DisputeStats {
  openCount: number;
  investigatingCount: number;
  resolvedCount: number;
  totalAmount: number;
  avgResolutionTime: number; // in hours
}

/**
 * Get all payment disputes (admin only)
 * Endpoint: GET /api/v1/admin/payments/disputes/
 */
export const getPaymentDisputes = async (): Promise<PaymentDispute[]> => {
  const res = await axios.get<ApiResponse<PaymentDispute[]>>('/admin/payments/disputes/');
  return res.data.data || [];
};

/**
 * Get dispute statistics
 * Endpoint: GET /api/v1/admin/payments/disputes/stats/
 */
export const getDisputeStats = async (): Promise<DisputeStats> => {
  const res = await axios.get<ApiResponse<DisputeStats>>('/admin/payments/disputes/stats/');
  if (!res.data.data) {
    return {
      openCount: 0,
      investigatingCount: 0,
      resolvedCount: 0,
      totalAmount: 0,
      avgResolutionTime: 0,
    };
  }
  return res.data.data;
};

/**
 * Update dispute status
 * Endpoint: PATCH /api/v1/admin/payments/disputes/:id/status/
 */
export const updateDisputeStatus = async (
  id: string,
  status: PaymentDispute['status'],
  notes?: string
): Promise<PaymentDispute> => {
  const res = await axios.patch<ApiResponse<PaymentDispute>>(
    `/admin/payments/disputes/${id}/status/`,
    { status, notes },
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to update dispute status');
  }
  return res.data.data;
};

/**
 * Resolve dispute
 * Endpoint: POST /api/v1/admin/payments/disputes/:id/resolve/
 */
export const resolveDispute = async (
  id: string,
  resolution: { outcome: 'refund' | 'reject'; notes: string; refundAmount?: number }
): Promise<PaymentDispute> => {
  const res = await axios.post<ApiResponse<PaymentDispute>>(
    `/admin/payments/disputes/${id}/resolve/`,
    resolution,
    { headers: csrf.getHeader() }
  );
  if (!res.data.data) {
    throw new Error('Failed to resolve dispute');
  }
  return res.data.data;
};

export const adminApi = {
  getAdminActivityFeed,
  getPaymentDisputes,
  getDisputeStats,
  updateDisputeStatus,
  resolveDispute,
};
