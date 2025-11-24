import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface DashboardData {
  profile: {
    is_verified: boolean;
    company_name: string | null;
    total_hostels: number;
    total_rooms: number;
    total_earnings: number;
  };
  subscription: {
    plan_name: string;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
    trial_remaining_days: number;
  } | null;
  stats: {
    total_hostels: number;
    total_rooms: number;
    available_rooms: number;
    occupied_rooms: number;
    active_bookings: number;
    total_earnings: number;
    unread_notifications: number;
  };
  hostels: Array<{
    hostel_id: number;
    name: string;
    status: string;
    total_rooms: number;
    available_rooms: number;
    occupied_rooms: number;
    base_price: number;
    is_verified: boolean;
    created_at: string;
  }>;
  recent_bookings: Array<{
    booking_id: number;
    booking_reference: string;
    student_name: string;
    hostel_name: string;
    room_number: string;
    status: string;
    total_amount: number;
    monthly_rent: number;
    move_in_date: string | null;
    created_at: string;
  }>;
  recent_payments: Array<{
    transaction_id: number;
    reference: string;
    student_name: string;
    amount: number;
    service_fee: number;
    paid_at: string | null;
  }>;
  quick_actions: Array<{
    action: string;
    label: string;
    available: boolean;
  }>;
}

const LandlordDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounts/landlord/dashboard/');
      setDashboardData(response.data);
    } catch (err) {
      setError((err as any).response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) return null;

  const { profile, subscription, stats, hostels, recent_bookings, recent_payments, quick_actions } = dashboardData;

  return (
    <DashboardLayout title="Landlord Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}!
          </h2>
          <p className="text-gray-600">
            {profile.company_name ? `Managing ${profile.company_name}` : 'Manage your hostels and track earnings'}
          </p>
          {!profile.is_verified && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                Your account is pending verification. Some features may be limited until verified.
              </p>
            </div>
          )}
        </div>

        {/* Subscription Status */}
        {subscription && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Plan</p>
                <p className="font-medium">{subscription.plan_name}</p>
                <p className="text-sm text-gray-500">Status: {subscription.status}</p>
                {subscription.trial_remaining_days > 0 && (
                  <p className="text-sm text-green-600">
                    {subscription.trial_remaining_days} days remaining in trial
                  </p>
                )}
              </div>
              <Link
                to="/landlord/subscription"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Manage Subscription
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hostels</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_hostels}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_rooms}</p>
                <p className="text-xs text-gray-500">{stats.available_rooms} available</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_bookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">KES {stats.total_earnings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quick_actions.map((action) => (
              <Link
                key={action.action}
                to={
                  action.action === 'add_hostel' ? '/landlord/hostels' :
                  action.action === 'manage_rooms' ? '/landlord/hostels' :
                  action.action === 'view_earnings' ? '/payments/history' :
                  '/contact'
                }
                className={`block p-4 text-center rounded-lg border transition-colors ${
                  action.available
                    ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                onClick={(e) => !action.available && e.preventDefault()}
              >
                <span className="font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <Link to="/landlord/bookings" className="text-blue-600 hover:text-blue-800 text-sm">
                View all
              </Link>
            </div>
            {recent_bookings.length > 0 ? (
              <div className="space-y-4">
                {recent_bookings.map((booking) => (
                  <div key={booking.booking_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.student_name}</p>
                      <p className="text-sm text-gray-600">
                        {booking.hostel_name} - Room {booking.room_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        KES {booking.monthly_rent.toLocaleString()}/month
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent bookings</p>
            )}
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
              <Link to="/payments/history" className="text-blue-600 hover:text-blue-800 text-sm">
                View all
              </Link>
            </div>
            {recent_payments.length > 0 ? (
              <div className="space-y-4">
                {recent_payments.map((payment) => (
                  <div key={payment.transaction_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{payment.student_name}</p>
                      <p className="text-sm text-gray-600">{payment.reference}</p>
                      <p className="text-xs text-gray-500">
                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        KES {payment.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Fee: KES {payment.service_fee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent payments</p>
            )}
          </div>
        </div>

        {/* Hostels Overview */}
        {hostels.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Hostels</h3>
              <Link to="/landlord/hostels" className="text-blue-600 hover:text-blue-800 text-sm">
                Manage Hostels
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hostels.map((hostel) => (
                <div key={hostel.hostel_id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{hostel.name}</h4>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      hostel.status === 'active' ? 'bg-green-100 text-green-800' :
                      hostel.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {hostel.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Rooms: {hostel.total_rooms} total</p>
                    <p>Available: {hostel.available_rooms}</p>
                    <p>Occupied: {hostel.occupied_rooms}</p>
                    <p>Price: KES {hostel.base_price.toLocaleString()}/month</p>
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

export default LandlordDashboard;