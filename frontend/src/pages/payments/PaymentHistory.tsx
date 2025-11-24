import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { usePayments } from '../../hooks/usePayments';
import PaymentFilters from '../../components/payments/PaymentFilters';
import TransactionTable from '../../components/payments/TransactionTable';
import type { Transaction } from '../../hooks/usePayments';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const {
    transactions,
    loading,
    error,
    filters,
    pagination,
    fetchTransactions,
    setFilters,
    clearFilters,
    getTransactionReceipt,
  } = usePayments();

  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTransactions(1);
  }, [filters]);

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    // Note: Sorting is handled on the backend, so we might need to pass sort params
    fetchTransactions(1);
  };

  const handlePageChange = (page: number) => {
    fetchTransactions(page);
  };

  const handleViewReceipt = async (transaction: Transaction) => {
    try {
      await getTransactionReceipt(transaction.id);
      navigate(`/payments/receipt/${transaction.id}`);
    } catch (err) {
      console.error('Error viewing receipt:', err);
      alert('Failed to load receipt. Please try again.');
    }
  };

  const handleDownloadReceipt = async (transaction: Transaction) => {
    try {
      const receiptUrl = await getTransactionReceipt(transaction.id);
      // In a real app, you'd handle the download here
      window.open(receiptUrl, '_blank');
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert('Failed to download receipt. Please try again.');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortField as keyof Transaction] || '';
    const bValue = b[sortField as keyof Transaction] || '';

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>
        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600 mt-1">View and manage all your payment transactions</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">!</span>
            </div>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <PaymentFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        className="mb-6"
      />

      {/* Transaction Table */}
      <TransactionTable
        transactions={sortedTransactions}
        loading={loading}
        onViewReceipt={handleViewReceipt}
        onDownloadReceipt={handleDownloadReceipt}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        className="mb-6"
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                if (pageNum > pagination.totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageNum === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Receipts</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.filter(t => t.receipt_url).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;