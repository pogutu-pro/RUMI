import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { authAPI, notificationAPI } from '../../services/api';
import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserIcon,
  BellIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  profile: {
    is_complete: boolean;
    completion_percentage: number;
  };
  stats: {
    total_bookings: number;
    active_bookings: number;
    total_spent: number;
    unread_notifications: number;
  };
  recent_bookings: Array<{
    booking_id: string;
    booking_reference: string;
    hostel_name: string;
    room_number: string;
    status: string;
    total_amount: number;
    balance_due: number;
    move_in_date: string | null;
    created_at: string;
  }>;
  recent_payments: Array<{
    transaction_id: string;
    reference: string;
    amount: number;
    type: string;
    paid_at: string | null;
  }>;
  quick_actions: Array<{
    action: string;
    label: string;
    available: boolean;
  }>;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await authAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications({ limit: 5 });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'reserved':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.first_name}! 👋
              </h1>
              <p className="text-primary-100 mt-1">
                Ready to find your next home or manage your current bookings?
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-primary-100">Profile Complete</div>
              <div className="text-2xl font-bold">{dashboardData.profile.completion_percentage}%</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.active_bookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.total_bookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(dashboardData.stats.total_spent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-accent-100 rounded-lg">
                <BellIcon className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Notifications</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.stats.unread_notifications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.quick_actions.map((action, index) => (
              <Link
                key={index}
                to={`/student/${action.action === 'search_rooms' ? 'browse-hostels' : 
                     action.action === 'complete_profile' ? 'profile' : 
                     action.action === 'view_receipts' ? 'payments' : 'support'}`}
                className={`flex items-center p-4 rounded-lg border-2 border-dashed transition-colors ${
                  action.available 
                    ? 'border-primary-300 hover:border-primary-400 bg-primary-50 hover:bg-primary-100' 
                    : 'border-gray-300 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{action.label}</p>
                </div>
                <PlusIcon className="h-5 w-5 text-primary-600" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            <Link
              to="/student/bookings"
              className="text-primary-600 hover:text-primary-800 font-medium flex items-center"
            >
              View all
              <EyeIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {dashboardData.recent_bookings.length === 0 ? (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings yet</p>
              <Link
                to="/student/browse-hostels"
                className="mt-2 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Find your first room
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.recent_bookings.map((booking) => (
                <div key={booking.booking_id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.hostel_name} - Room {booking.room_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ref: {booking.booking_reference}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Move in: {formatDate(booking.move_in_date)}</span>
                        <span>{formatCurrency(booking.total_amount)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {booking.balance_due > 0 && (
                        <span className="text-sm text-red-600 font-medium">
                          Due: {formatCurrency(booking.balance_due)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <Link
              to="/student/payments"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              View all
              <EyeIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {dashboardData.recent_payments.length === 0 ? (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.recent_payments.map((payment) => (
                <div key={payment.transaction_id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)} Payment
                      </p>
                      <p className="text-sm text-gray-500">
                        Ref: {payment.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(payment.paid_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
              <Link
                to="/student/notifications"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                View all
                <EyeIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="p-1 bg-blue-100 rounded">
                    <BellIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;