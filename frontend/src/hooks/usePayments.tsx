import { useState, useCallback } from 'react';
import { paymentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_type: 'subscription' | 'booking' | 'marketplace' | 'late_fee';
  description: string;
  created_at: string;
  updated_at: string;
  reference: string;
  payment_method?: string;
  receipt_url?: string;
}

interface RecurringPayment {
  id: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'yearly';
  status: 'active' | 'paused' | 'cancelled';
  next_billing_date: string;
  description: string;
  created_at: string;
}

interface PaymentFilters {
  date_from?: string;
  date_to?: string;
  transaction_type?: string;
  status?: string;
  search?: string;
}

interface UsePaymentsReturn {
  transactions: Transaction[];
  recurringPayments: RecurringPayment[];
  loading: boolean;
  error: string | null;
  filters: PaymentFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  fetchTransactions: (page?: number, pageSize?: number) => Promise<void>;
  fetchRecurringPayments: () => Promise<void>;
  getTransactionReceipt: (transactionId: string) => Promise<string>;
  setFilters: (filters: Partial<PaymentFilters>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export const usePayments = (): UsePaymentsReturn => {
  const { isAuthenticated, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PaymentFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setFilters = useCallback((newFilters: Partial<PaymentFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const fetchTransactions = useCallback(async (page: number = 1, pageSize: number = 20) => {
    if (!isAuthenticated || !user) {
      setError('Please login to access payment history');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page,
        page_size: pageSize,
        ...filters,
      };

      const response = await paymentAPI.getTransactions(params);
      setTransactions(response.data.results || response.data);
      setPagination({
        page: response.data.page || page,
        pageSize: response.data.page_size || pageSize,
        total: response.data.count || response.data.total || 0,
        totalPages: response.data.total_pages || Math.ceil((response.data.count || response.data.total || 0) / pageSize),
      });
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, filters]);

  const fetchRecurringPayments = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setError('Please login to access recurring payments');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await paymentAPI.getRecurringPayments();
      setRecurringPayments(response.data.results || response.data);
    } catch (err: any) {
      console.error('Error fetching recurring payments:', err);
      setError(err.message || 'Failed to load recurring payments');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const getTransactionReceipt = useCallback(async (transactionId: string): Promise<string> => {
    if (!isAuthenticated || !user) {
      throw new Error('Please login to access receipts');
    }

    try {
      const response = await paymentAPI.getTransactionReceipt(transactionId);
      return response.data.receipt_url || response.data;
    } catch (err: any) {
      console.error('Error fetching receipt:', err);
      throw new Error(err.message || 'Failed to load receipt');
    }
  }, [isAuthenticated, user]);

  return {
    transactions,
    recurringPayments,
    loading,
    error,
    filters,
    pagination,
    fetchTransactions,
    fetchRecurringPayments,
    getTransactionReceipt,
    setFilters,
    clearFilters,
    clearError,
  };
};

export type { Transaction, RecurringPayment, PaymentFilters };