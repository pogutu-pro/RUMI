/**
 * RUMI Receipt API Service
 * Frontend service for interacting with payment receipt endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Receipt {
  id: number;
  receipt_number: string;
  pdf_file: string | null;
  generated_at: string;
  emailed_at: string | null;
  email_sent: boolean;
  transaction_details: {
    transaction_reference: string;
    paystack_reference: string | null;
    student: {
      name: string;
      email: string;
    };
    landlord: {
      name: string;
      email: string;
    };
    booking: {
      reference: string;
      hostel: string;
      room: string;
      check_in_date: string;
      check_out_date: string;
    };
    payment_details: {
      type: string;
      base_rent: number;
      service_fee: number;
      total_charged: number;
      landlord_payout: number;
      status: string;
      paid_at: string | null;
    };
    platform_fees: {
      service_fee: number;
      gateway_fee: number;
      net_revenue: number;
    };
  };
}

export interface Transaction {
  id: number;
  transaction_reference: string;
  transaction_type: string;
  total_charged_amount: number;
  status: string;
  initiated_at: string;
  paid_at: string | null;
  has_receipt?: boolean;
  receipt_number?: string;
}

export interface TransactionsResponse {
  total_transactions: number;
  transactions: Transaction[];
}

class ReceiptAPI {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get receipt for a specific transaction
   */
  async getReceipt(transactionId: number): Promise<Receipt> {
    return this.makeRequest<Receipt>(`/payments/receipts/${transactionId}/`);
  }

  /**
   * List all transactions for the authenticated student
   */
  async getStudentTransactions(
    filters: {
      status?: string;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TransactionsResponse> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const endpoint = `/payments/transactions/student/${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<TransactionsResponse>(endpoint);
  }

  /**
   * Get detailed information about a specific transaction
   */
  async getTransactionDetail(transactionId: number): Promise<Transaction> {
    return this.makeRequest<Transaction>(`/payments/transactions/student/${transactionId}/`);
  }

  /**
   * Download PDF receipt directly
   */
  async downloadReceiptPDF(transactionId: number): Promise<Blob> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/payments/receipts/${transactionId}/`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download receipt: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Check if a transaction has a receipt
   */
  async checkReceiptExists(transactionId: number): Promise<boolean> {
    try {
      await this.getReceipt(transactionId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get transactions with receipt status
   */
  async getTransactionsWithReceipts(): Promise<TransactionsResponse> {
    const response = await this.getStudentTransactions();
    
    // Enhance transactions with receipt information
    const enhancedTransactions = await Promise.all(
      response.transactions.map(async (transaction) => {
        const hasReceipt = await this.checkReceiptExists(transaction.id);
        return {
          ...transaction,
          has_receipt: hasReceipt,
          receipt_number: hasReceipt ? `RUMI-${transaction.id}` : undefined,
        };
      })
    );

    return {
      ...response,
      transactions: enhancedTransactions,
    };
  }
}

// Create and export singleton instance
export const receiptAPI = new ReceiptAPI();

// Utility functions for frontend components
export const receiptUtils = {
  /**
   * Format currency amount
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Format date for display
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  /**
   * Open PDF in new tab
   */
  openReceiptPDF(pdfUrl: string): void {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  },

  /**
   * Download PDF file
   */
  downloadReceiptFile(pdfUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default receiptAPI;