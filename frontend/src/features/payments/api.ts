import apiClient from '@/lib/api/client';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

// -- Types --

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  type: 'rent' | 'deposit' | 'other';
}

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currency: string;
  recipient: string;
  createdAt: string;
  scheduledDate?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  reason: string;
  createdAt: string;
}

export interface PaymentInitializeRequest {
  amount: number;
  currency?: string;
  email: string;
  metadata?: Record<string, any>;
  callbackUrl?: string; // e.g. for Paystack redirect
}

export interface PaymentInitializeResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

// -- API Service --

export const paymentsApi = {
  // Initialize Payment
  // POST /payments/initialize/
  initializePayment: async (data: PaymentInitializeRequest) => {
    const res = await apiClient.post<ApiResponse<PaymentInitializeResponse>>(
      '/payments/initialize/',
      data
    );
    return res.data;
  },

  // Landlord Payouts
  // GET /payments/payouts/landlord/
  getLandlordPayouts: async () => {
    const res = await apiClient.get<PaginatedResponse<Payout>>(
      '/payments/payouts/landlord/'
    );
    return res.data;
  },

  // Receipts
  // GET /payments/receipts/{transaction_id}/
  getReceipt: async (transactionId: string) => {
    const res = await apiClient.get<ApiResponse<any>>(
      `/payments/receipts/${transactionId}/`
    );
    return res.data;
  },

  // Create Refund Request
  // POST /payments/refunds/
  createRefundRequest: async (data: RefundRequest) => {
    const res = await apiClient.post<ApiResponse<Refund>>(
      '/payments/refunds/',
      data
    );
    return res.data;
  },

  // List Refunds
  // GET /payments/refunds/list/
  getRefunds: async () => {
    const res = await apiClient.get<PaginatedResponse<Refund>>(
      '/payments/refunds/list/'
    );
    return res.data;
  },

  // Process Refund (Admin/System)
  // POST /payments/refunds/{refund_id}/process/
  processRefund: async (refundId: string) => {
    const res = await apiClient.post<ApiResponse<Refund>>(
      `/payments/refunds/${refundId}/process/`
    );
    return res.data;
  },

  // Transactions: Admin
  // GET /payments/transactions/admin/
  getAdminTransactions: async () => {
    const res = await apiClient.get<PaginatedResponse<PaymentTransaction>>(
      '/payments/transactions/admin/'
    );
    return res.data;
  },

  // Transactions: Landlord
  // GET /payments/transactions/landlord/
  getLandlordTransactions: async () => {
    const res = await apiClient.get<PaginatedResponse<PaymentTransaction>>(
      '/payments/transactions/landlord/'
    );
    return res.data;
  },

  // Transactions: Student
  // GET /payments/transactions/student/
  getStudentTransactions: async () => {
    const res = await apiClient.get<PaginatedResponse<PaymentTransaction>>(
      '/payments/transactions/student/'
    );
    return res.data;
  },

  // Transaction Detail: Student
  // GET /payments/transactions/student/{transaction_id}/
  getStudentTransactionDetail: async (transactionId: string) => {
    const res = await apiClient.get<ApiResponse<PaymentTransaction>>(
      `/payments/transactions/student/${transactionId}/`
    );
    return res.data;
  },

  // Webhook (Usually server-to-server, but included per spec)
  // POST /payments/webhook/paystack/
  paystackWebhook: async (data: any) => {
    const res = await apiClient.post<ApiResponse<any>>(
      '/payments/webhook/paystack/',
      data
    );
    return res.data;
  },

  // Payment Stats
  getPaymentStats: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/payments/analytics/revenue/'); // Use any or Import PaymentStats if easier for now, keeping it simple as I can't import Payment API func easily here without refactor
    // Actually api.ts calls apiClient directly.
    return res.data.data || {
        totalRevenue: 0,
        pendingAmount: 0,
        failedAmount: 0,
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0,
      };
  },
};
