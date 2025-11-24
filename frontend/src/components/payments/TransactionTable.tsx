import React from 'react';
import { ChevronUp, ChevronDown, Receipt, Eye, Download } from 'lucide-react';
import type { Transaction } from '../../hooks/usePayments';

interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onViewReceipt?: (transaction: Transaction) => void;
  onDownloadReceipt?: (transaction: Transaction) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  className?: string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  loading = false,
  onViewReceipt,
  onDownloadReceipt,
  sortField,
  sortDirection = 'desc',
  onSort,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels = {
      subscription: 'Subscription',
      booking: 'Booking',
      marketplace: 'Marketplace',
      late_fee: 'Late Fee',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSortableHeader = (field: string, children: React.ReactNode, className: string = '') => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${className}`}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ?
            <ChevronUp className="w-4 h-4" /> :
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-600">You haven't made any payments yet.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {renderSortableHeader('created_at', 'Date')}
              {renderSortableHeader('description', 'Description')}
              {renderSortableHeader('transaction_type', 'Type')}
              {renderSortableHeader('amount', 'Amount')}
              {renderSortableHeader('status', 'Status')}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.created_at)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-gray-500 text-xs">Ref: {transaction.reference}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getTransactionTypeLabel(transaction.transaction_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {onViewReceipt && (
                      <button
                        onClick={() => onViewReceipt(transaction)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="View Receipt"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    )}
                    {onDownloadReceipt && transaction.receipt_url && (
                      <button
                        onClick={() => onDownloadReceipt(transaction)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        title="Download Receipt"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;