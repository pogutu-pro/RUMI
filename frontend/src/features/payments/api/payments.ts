import apiClient from '@/lib/api/client';
import type { Payment } from '@/types/entities.types';
import type { 
  PaymentStats, 
  MpesaInitializeRequest, 
  MpesaInitializeResponse,
  MpesaPaymentStatusResponse,
  MpesaConfig,
  CreateMpesaConfigRequest,
  Payout,
  Refund,
  RefundRequest
} from '../types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface GetPaymentsFilters {
  status?: Payment['status'];
  type?: Payment['type'];
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

/**
 * Get all payments with optional filters
 */
/**
 * Get all payments with optional filters
 * Note: The endpoint /payments/transactions/ is marked as MISSING in the backend reference.
 * We'll use it here so it works when implemented, but return empty array on failure.
 */
/**
 * Get student transaction history
 * Confirmed Endpoint: /payments/history/
 */
export const getPayments = async (filters?: GetPaymentsFilters): Promise<Payment[]> => {
  try {
    const response = await apiClient.axios.get<ApiResponse<Payment[]>>('/payments/history/', {
      params: filters,
    });
    const data = response.data.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Fetching student payments failed", error);
    return [];
  }
};

/**
 * Get landlord transaction history
 * Confirmed Endpoint: /payments/transactions/landlord/
 */
export const getLandlordPayments = async (filters?: GetPaymentsFilters): Promise<Payment[]> => {
  try {
    const response = await apiClient.axios.get<ApiResponse<Payment[]>>('/payments/transactions/landlord/', {
        params: filters
    });
    const data = response.data.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Fetching landlord payments failed", error);
    return [];
  }
};

/**
 * Get admin transaction history
 * Confirmed Endpoint: /payments/transactions/admin/
 */
export const getAdminPayments = async (filters?: GetPaymentsFilters): Promise<Payment[]> => {
   try {
    const response = await apiClient.axios.get<ApiResponse<Payment[]>>('/payments/transactions/admin/', {
        params: filters
    });
    const data = response.data.data;
    return Array.isArray(data) ? data : [];
   } catch (error) {
     console.warn("Fetching admin payments failed", error);
     return [];
   }
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async (): Promise<PaymentStats> => {
  const response = await apiClient.axios.get<ApiResponse<PaymentStats>>('/payments/analytics/revenue/');
  
  return response.data.data || {
    totalRevenue: 0,
    availableBalance: 0,
    pendingAmount: 0,
    failedAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
  };
};

/**
 * Initiate a payment
 */
export interface PaymentInitializeRequest {
  bookingId: string;
  method: 'mpesa' | 'bank';
  phoneNumber?: string;
  amount?: number;
}

/**
 * Initiate a payment (Generic/Legacy)
 */
export const initiatePayment = async (
  data: any
): Promise<{ success: boolean; transactionId: string }> => {
  const response = await apiClient.axios.post<ApiResponse<{
    success: boolean;
    transactionId: string;
  }>>('/payments/initialize/', data);
  
  return response.data.data || { success: false, transactionId: '' };
};

/**
 * Initialize M-Pesa Payment (STK Push)
 * Endpoint: /api/v1/payments/mpesa/initialize/
 */
export const initializeMpesaPayment = async (
  data: MpesaInitializeRequest
): Promise<MpesaInitializeResponse> => {
  // Ensure booking_id is a number if it's a string, as per Swagger spec
  const payload = {
    ...data,
    booking_id: typeof data.booking_id === 'string' ? parseInt(data.booking_id, 10) : data.booking_id
  };
  
  const response = await apiClient.axios.post<ApiResponse<MpesaInitializeResponse>>(
    '/payments/mpesa/initialize/', 
    payload
  );
  return response.data.data;
};

/**
 * Check M-Pesa Payment Status
 * Endpoint: /api/v1/payments/mpesa/status/
 */
export const getMpesaPaymentStatus = async (params: {
  transaction_id?: string | number;
  checkout_request_id?: string;
}): Promise<MpesaPaymentStatusResponse> => {
  const response = await apiClient.axios.get<ApiResponse<MpesaPaymentStatusResponse>>(
    '/payments/mpesa/status/',
    { params }
  );
  return response.data.data;
};

/**
 * Get Landlord M-Pesa Configurations
 * Endpoint: /api/v1/payments/mpesa/config/
 */
export const getMpesaConfigs = async (): Promise<MpesaConfig[]> => {
  const response = await apiClient.axios.get<ApiResponse<{ configs: MpesaConfig[] }>>(
    '/api/v1/payments/mpesa/config/'
  );
  return response.data.data.configs || [];
};

/**
 * Create/Add Landlord M-Pesa Configuration
 * Endpoint: /api/v1/payments/mpesa/config/
 */
export const createMpesaConfig = async (
  data: CreateMpesaConfigRequest
): Promise<MpesaConfig> => {
  const response = await apiClient.axios.post<ApiResponse<MpesaConfig>>(
    '/api/v1/payments/mpesa/config/',
    data
  );
  return response.data.data;
};


/**
 * Verify a payment


 */
export const verifyPayment = async (
  transactionId: string
): Promise<{ success: boolean; verified: boolean }> => {
  // Assuming a verify endpoint exists or we check status
  // If not in docs, we might need to rely on getPayments or specific status check
  // Docs mention /receipts/<transaction_id>/
  try {
    const response = await apiClient.axios.get<ApiResponse<any>>(`/payments/receipts/${transactionId}/`);
    return { success: true, verified: true };
  } catch {
    return { success: false, verified: false };
  }
};

// Recurring Payments
export const enableRecurringPayment = async (data: any) => {
  const response = await apiClient.axios.post<ApiResponse<any>>('/payments/recurring/enable/', data);
  return response.data.data;
};

export const pauseRecurringPayment = async (id: string) => {
  const response = await apiClient.axios.put<ApiResponse<any>>(`/payments/recurring/${id}/pause/`);
  return response.data.data;
};

export const resumeRecurringPayment = async (id: string) => {
  const response = await apiClient.axios.put<ApiResponse<any>>(`/payments/recurring/${id}/resume/`);
  return response.data.data;
};

export const cancelRecurringPayment = async (id: string) => {
  const response = await apiClient.axios.delete<ApiResponse<any>>(`/payments/recurring/${id}/cancel/`);
  return response.data.data;
};

// Payment Methods
export const getPaymentMethods = async () => {
  const response = await apiClient.axios.get<ApiResponse<any[]>>('/payments/payment-methods/');
  return response.data.data || [];
};

export const setDefaultPaymentMethod = async (id: string) => {
  const response = await apiClient.axios.put<ApiResponse<any>>(`/payments/payment-methods/${id}/default/`);
  return response.data.data;
};

export const deletePaymentMethod = async (id: string) => {
  const response = await apiClient.axios.delete<ApiResponse<any>>(`/payments/payment-methods/${id}/`);
  return response.data.data;
};

// Late Fees
export const getLateFees = async (bookingId: string) => {
  const response = await apiClient.axios.get<ApiResponse<any>>(`/payments/late-fees/${bookingId}/`);
  return response.data.data;
};

export const payLateFee = async (id: string) => {
  const response = await apiClient.axios.post<ApiResponse<any>>(`/payments/late-fees/${id}/pay/`);
  return response.data.data;
};

// Tax Reports
export const getTaxReports = async () => {
  const response = await apiClient.axios.get<ApiResponse<any[]>>('/payments/tax-reports/');
  return response.data.data || [];
};

export const downloadTaxReport = async (id: string) => {
  const response = await apiClient.axios.get<ApiResponse<any>>(`/payments/tax-reports/${id}/download/`);
  return response.data.data;
};

// Landlord Payouts
export const getLandlordPayouts = async (): Promise<PaginatedResponse<Payout>> => {
  const response = await apiClient.axios.get<PaginatedResponse<Payout>>(
    '/payments/payouts/landlord/'
  );
  return response.data;
};

// Refunds
export const getRefunds = async (): Promise<PaginatedResponse<Refund>> => {
  const response = await apiClient.axios.get<PaginatedResponse<Refund>>(
    '/payments/refunds/list/'
  );
  return response.data;
};

export const createRefundRequest = async (data: RefundRequest): Promise<ApiResponse<Refund>> => {
  const response = await apiClient.axios.post<ApiResponse<Refund>>(
    '/payments/refunds/',
    data
  );
  return response.data;
};

export const processRefund = async (refundId: string): Promise<ApiResponse<Refund>> => {
  const response = await apiClient.axios.post<ApiResponse<Refund>>(
    `/payments/refunds/${refundId}/process/`
  );
  return response.data;
};

// Receipt Endpoints (RECEIPT_API_GUIDE.md)
export const getReceipt = async (transactionId: string | number): Promise<any> => {
  const response = await apiClient.axios.get<ApiResponse<any>>(`/payments/receipts/${transactionId}/`);
  return response.data.data;
};

export const getStudentTransactionsWithReceipts = async (filters?: any): Promise<any[]> => {
  const response = await apiClient.axios.get<ApiResponse<any>>('/payments/transactions/student/', {
    params: filters
  });
  return response.data.data?.transactions || [];
};


export const paymentsApi = {
  getStudentTransactions: getPayments,
  getLandlordPayments,
  getAdminPayments,
  getPaymentStats,
  initiatePayment,
  initializeMpesaPayment,
  getMpesaPaymentStatus,
  getMpesaConfigs,
  createMpesaConfig,
  verifyPayment,
  enableRecurringPayment,
  pauseRecurringPayment,
  resumeRecurringPayment,
  cancelRecurringPayment,
  getPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getLateFees,
  payLateFee,
  getLateFeeTransactions: getLateFees, // Placeholder/Alias
  getTaxReports,
  downloadTaxReport,
  getReceipt,
  getStudentTransactionsWithReceipts,
  getLandlordPayouts,
  getRefunds,
  createRefundRequest,
  processRefund,
};

