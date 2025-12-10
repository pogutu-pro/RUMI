import { apiClient } from './client';

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

export const techSupportApi = {
  // Users
  getUsers: async (params?: any) => {
    return apiClient.axios.get<TechSupportUser[]>('/accounts/tech-support/users/', { params });
  },
  verifyUser: async (userId: string) => {
    return apiClient.axios.post(`/accounts/tech-support/users/${userId}/verify/`);
  },
  toggleUserLock: async (userId: string, reason: string) => {
    return apiClient.axios.post(`/accounts/tech-support/users/${userId}/toggle-lock/`, { reason });
  },

  // Hostels
  getHostels: async (params?: any) => {
    return apiClient.axios.get<TechSupportHostel[]>('/hostels/tech-support/', { params });
  },
  verifyHostel: async (hostelId: string) => {
    return apiClient.axios.post(`/hostels/tech-support/${hostelId}/verify/`);
  },
  toggleHostelVisibility: async (hostelId: string, reason: string) => {
    return apiClient.axios.post(`/hostels/tech-support/${hostelId}/toggle-visibility/`, { reason });
  },
  flagHostel: async (hostelId: string, reason: string) => {
    return apiClient.axios.post(`/hostels/tech-support/${hostelId}/flag/`, { reason });
  },

  // Payments
  getTransactions: async (params?: any) => {
    return apiClient.axios.get<TechSupportTransaction[]>('/payments/tech-support/', { params });
  },
  requestRefund: async (transactionId: string, reason: string) => {
    return apiClient.axios.post(`/payments/tech-support/${transactionId}/request-refund/`, { reason });
  },

  // Complaints
  getTickets: async (params?: any) => {
    return apiClient.axios.get<TechSupportTicket[]>('/support/tech-support/tickets/', { params });
  },
  assignTicket: async (ticketId: string) => {
    return apiClient.axios.post(`/support/tech-support/tickets/${ticketId}/assign/`);
  },
  resolveTicket: async (ticketId: string, resolution: string) => {
    return apiClient.axios.post(`/support/tech-support/tickets/${ticketId}/resolve/`, { resolution });
  },
  escalateTicket: async (ticketId: string, reason: string) => {
    return apiClient.axios.post(`/support/tech-support/tickets/${ticketId}/escalate/`, { reason });
  },
  
  // Messaging
  getMessages: async (params?: any) => {
    return apiClient.axios.get<TechSupportMessage[]>('/messaging/tech-support/', { params });
  },
  sendMessage: async (userId: string, content: string) => {
    return apiClient.axios.post('/messaging/tech-support/send/', { user_id: userId, content });
  },

  // Logs
  getLogs: async (params?: any) => {
    return apiClient.axios.get<TechSupportLog[]>('/accounts/tech-support/logs/', { params });
  },

  // Dashboard Stats
  getStats: async () => {
    return apiClient.axios.get('/accounts/tech-support/stats/');
  }
};
