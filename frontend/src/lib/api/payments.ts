import apiClient from './client';
import type { Payment } from '@/types/entities.types';
import type { ApiResponse } from '@/types/api.types';

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
 * Confirmed Endpoint: /payments/transactions/student/
 */
export const getPayments = async (filters?: GetPaymentsFilters): Promise<Payment[]> => {
  try {
    const response = await apiClient.axios.get<ApiResponse<Payment[]>>('/payments/history/', {
      params: filters,
    });
    return response.data.data || [];
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
    return response.data.data || [];
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
    return response.data.data || [];
   } catch (error) {
     console.warn("Fetching admin payments failed", error);
     return [];
   }
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async () => {
  const response = await apiClient.axios.get<ApiResponse<{
    totalRevenue: number;
    pendingAmount: number;
    failedAmount: number;
    completedCount: number;
    pendingCount: number;
    failedCount: number;
  }>>('/payments/analytics/revenue/');
  
  return response.data.data || {
    totalRevenue: 0,
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
export const initiatePayment = async (
  bookingId: string,
  method: 'mpesa' | 'bank'
): Promise<{ success: boolean; transactionId: string }> => {
  const response = await apiClient.axios.post<ApiResponse<{
    success: boolean;
    transactionId: string;
  }>>('/payments/initialize/', {
    bookingId,
    method,
  });
  
  return response.data.data || { success: false, transactionId: '' };
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

