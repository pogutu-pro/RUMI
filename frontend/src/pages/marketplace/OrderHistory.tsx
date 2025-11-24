import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { marketplaceAPI } from '../../services/api';
import OrderCard from '../../components/marketplace/OrderCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface Order {
  order_id: string;
  status: string;
  created_at: string;
  total_amount: number;
  items: Array<{
    product_id: number;
    title: string;
    price: number;
    quantity: number;
    image_url?: string;
    condition: string;
    category: string;
  }>;
  seller_name: string;
  shipping_address?: string;
  tracking_number?: string;
}

const OrderHistory: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};

      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date_range = dateFilter;

      const response = await marketplaceAPI.getOrders(params);
      setOrders(response.data.results || response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await marketplaceAPI.markOrderDelivered(orderId);
      // Refresh orders after marking as delivered
      fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to mark order as delivered');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
    fetchOrders();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your orders.
          </p>
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/marketplace" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="sm:w-48">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FunnelIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders found</h2>
            <p className="text-gray-600 mb-8">
              {searchTerm || statusFilter || dateFilter
                ? "Try adjusting your filters to see more orders."
                : "You haven't placed any orders yet."
              }
            </p>
            <Link
              to="/marketplace"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.order_id} className="relative">
                <OrderCard order={order} />
                {order.status.toLowerCase() === 'shipped' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleMarkDelivered(order.order_id)}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Mark as Delivered
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;