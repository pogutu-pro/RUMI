import apiClient from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

// Types
export interface TechSupportUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'landlord' | 'caretaker';
  is_active: boolean;
  is_verified: boolean;
  phone_number: string;
  date_joined: string;
}

export interface TechSupportHostel {
  id: string;
  name: string;
  landlord_name: string;
  location: string;
  status: 'pending' | 'active' | 'hidden' | 'flagged';
  rooms_count: number;
  is_verified: boolean;
}

export interface TechSupportTransaction {
  id: string;
  transaction_reference: string;
  student_name: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  date: string;
  type: string;
}

export interface TechSupportTicket {
  id: string;
  subject: string;
  user_name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  category: string;
  created_at: string;
}

export interface TechSupportLog {
  id: string;
  user: string;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export interface TechSupportMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

// Predicted Endpoints based on standard REST patterns and existing /support/ routing
export const techSupportApi = {
  // Users
  getUsers: async (params?: { role?: string; is_active?: boolean; is_verified?: boolean; search?: string }) => {
    const response = await apiClient.axios.get<ApiResponse<TechSupportUser[]>>('/support/users/', { params });
    return response.data;
  },

  // Get user profile details - Available in SETUP_GUIDE.md
  getUserProfile: async (userId: string) => {
    const response = await apiClient.axios.get<ApiResponse<TechSupportUser & { activity_log?: any[] }>>(`/support/users/${userId}/support/`);
    return response.data;
  },

  // Verify user identity - Suggested endpoint (documented in MISSING_ENDPOINTS.md)
  verifyUser: async (userId: string) => {
    return apiClient.axios.post<ApiResponse<TechSupportUser>>(`/support/users/${userId}/verify/`);
  },

  // Toggle user lock/suspend - Suggested endpoint (documented in MISSING_ENDPOINTS.md)
  toggleUserLock: async (userId: string, reason: string) => {
    return apiClient.axios.post<ApiResponse<TechSupportUser>>(`/support/users/${userId}/toggle-lock/`, { reason });
  },

  // Reset user password - Available in SETUP_GUIDE.md
  resetUserPassword: async (userId: string) => {
    return apiClient.axios.post(`/support/users/${userId}/reset-password/`);
  },

  // Get verification queue (unverified users)
  getVerificationQueue: async (params?: { role?: string; page?: number; page_size?: number }) => {
    const response = await apiClient.axios.get<ApiResponse<TechSupportUser[]>>('/support/users/', { 
      params: { ...params, is_verified: false } 
    });
    return response.data;
  },


  // Hostels
  getHostels: async (params?: any) => {
    const response = await apiClient.axios.get<ApiResponse<TechSupportHostel[]>>('/support/hostels/', { params });
    return response.data;
  },
  verifyHostel: async (hostelId: string) => {
    return apiClient.axios.post(`/support/hostels/${hostelId}/verify/`);
  },
  toggleHostelVisibility: async (hostelId: string, reason: string) => {
    return apiClient.axios.post(`/support/hostels/${hostelId}/visibility/`, { reason }); // Simplified endpoint prediction
  },
  flagHostel: async (hostelId: string, reason: string) => {
    return apiClient.axios.post(`/support/hostels/${hostelId}/flag/`, { reason });
  },

  // Payments
  getTransactions: async (params?: any) => {
    const response = await apiClient.axios.get<ApiResponse<TechSupportTransaction[]>>('/support/transactions/', { params });
    return response.data;
  },
  requestRefund: async (transactionId: string, reason: string) => {
    return apiClient.axios.post(`/support/transactions/${transactionId}/refund-request/`, { reason });
  },

  // Complaints (Tickets) - Reusing standard support endpoints but maybe with admin privileges
  getTickets: async (params?: any) => {
    const response = await apiClient.axios.get<ApiResponse<TechSupportTicket[]>>('/support/tickets/admin/', { params }); // Likely an admin-specific endpoint
    return response.data;
  },
  assignTicket: async (ticketId: string, assigneeId?: string) => {
     // If assigneeId is provided, assign to them, else maybe auto-assign to self?
    return apiClient.axios.post(`/support/tickets/${ticketId}/assign/`, { assigneeId });
  },
  resolveTicket: async (ticketId: string, resolution: string) => {
    return apiClient.axios.post(`/support/tickets/${ticketId}/resolve/`, { resolution });
  },
  escalateTicket: async (ticketId: string, reason: string) => {
    return apiClient.axios.post(`/support/tickets/${ticketId}/escalate/`, { reason });
  },
  
  // Messaging
  getMessages: async (params?: any) => {
    const response = await apiClient.axios.get<ApiResponse<TechSupportMessage[]>>('/support/messages/', { params });
    return response.data;
  },
  sendMessage: async (userId: string, content: string) => {
    return apiClient.axios.post('/support/messages/send/', { user_id: userId, content });
  },

  // Logs
  getLogs: async (params?: any) => {
    const response = await apiClient.axios.get<ApiResponse<TechSupportLog[]>>('/support/logs/', { params });
    return response.data;
  },

  // Dashboard Stats
  getStats: async () => {
    const response = await apiClient.axios.get<ApiResponse<any>>('/support/stats/');
    return response.data;
  },

  // System Health
  getSystemHealth: async () => {
    const response = await apiClient.axios.get<ApiResponse<any>>('/support/system-health/');
    return response.data;
  },

  // Analytics
  getAnalyticsPerformance: async () => {
    const response = await apiClient.axios.get<ApiResponse<any>>('/support/analytics/performance/');
    return response.data;
  },

  // Team
  getTechSupportTeam: async () => {
    const response = await apiClient.axios.get<ApiResponse<any>>('/support/tech-support/');
    return response.data;
  }
};
