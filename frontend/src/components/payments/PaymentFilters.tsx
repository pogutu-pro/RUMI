import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { PaymentFilters as PaymentFiltersType } from '../../hooks/usePayments';

interface PaymentFiltersProps {
  filters: PaymentFiltersType;
  onFiltersChange: (filters: Partial<PaymentFiltersType>) => void;
  onClearFilters: () => void;
  className?: string;
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const transactionTypes = [
    { value: '', label: 'All Types' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'booking', label: 'Booking' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'late_fee', label: 'Late Fee' },
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== undefined && value !== '' && value !== null
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Transaction Type */}
        <div>
          <select
            value={filters.transaction_type || ''}
            onChange={(e) => onFiltersChange({ transaction_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => onFiltersChange({ date_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex-1">
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => onFiltersChange({ date_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Search: {filters.search}
              <button
                onClick={() => onFiltersChange({ search: '' })}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.transaction_type && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Type: {transactionTypes.find(t => t.value === filters.transaction_type)?.label}
              <button
                onClick={() => onFiltersChange({ transaction_type: '' })}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
              Status: {statuses.find(s => s.value === filters.status)?.label}
              <button
                onClick={() => onFiltersChange({ status: '' })}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(filters.date_from || filters.date_to) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
              Date: {filters.date_from || '...'} to {filters.date_to || '...'}
              <button
                onClick={() => onFiltersChange({ date_from: '', date_to: '' })}
                className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentFilters;