import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { authAPI } from '../../services/api';
import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface Booking {
  id: string;
  booking_reference: string;
  hostel_name: string;
  room_number: string;
  room_type: string;
  status: 'pending' | 'confirmed' | 'reserved' | 'cancelled' | 'completed';
  total_amount: number;
  balance_due: number;
  paid_amount: number;
  move_in_date: string | null;
  move_out_date: string | null;
  created_at: string;
  hostel_address: string;
  landlord_name: string;
  landlord_phone: string;
  amenities: string[];
}

interface BookingFilters {
  status: string;
  dateRange: string;
}

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filters, setFilters] = useState<BookingFilters>({
    status: 'all',
    dateRange: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchBookings();
  }, [activeTab, filters, currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getDashboard();
      
      // Transform the data from the dashboard response
      const transformedBookings: Booking[] = response.data.recent_bookings.map((booking: any) => ({
        id: booking.booking_id,
        booking_reference: booking.booking_reference,
        hostel_name: booking.hostel_name,
        room_number: booking.room_number,
        room_type: 'Single Room', // This would come from the actual API
        status: booking.status,
        total_amount: booking.total_amount,
        balance_due: booking.balance_due,
        paid_amount: booking.total_amount - booking.balance_due,
        move_in_date: booking.move_in_date,
        move_out_date: null, // This would come from the actual API
        created_at: booking.created_at,
        hostel_address: '123 Test Street, Test City', // This would come from the actual API
        landlord_name: 'Test Landlord', // This would come from the actual API
        landlord_phone: '+254712345678', // This would come from the actual API
        amenities: ['WiFi', 'Laundry', 'Security'] // This would come from the actual API
      }));

      // Mock additional bookings for demonstration
      const mockBookings: Booking[] = [
        {
          id: '2',
          booking_reference: 'RUMI-2024-002',
          hostel_name: 'Sunrise Hostel',
          room_number: 'B-205',
          room_type: 'Shared Room',
          status: 'confirmed',
          total_amount: 15000,
          balance_due: 0,
          paid_amount: 15000,
          move_in_date: '2024-02-01',
          move_out_date: '2024-05-31',
          created_at: '2024-01-15T10:30:00Z',
          hostel_address: '456 University Road, Test City',
          landlord_name: 'Jane Smith',
          landlord_phone: '+254723456789',
          amenities: ['WiFi', 'Mess Hall', 'Study Room']
        },
        {
          id: '3',
          booking_reference: 'RUMI-2024-003',
          hostel_name: 'Green Valley Residence',
          room_number: 'A-103',
          room_type: 'Single Room',
          status: 'cancelled',
          total_amount: 18000,
          balance_due: 0,
          paid_amount: 18000,
          move_in_date: null,
          move_out_date: null,
          created_at: '2023-12-01T14:20:00Z',
          hostel_address: '789 College Avenue, Test City',
          landlord_name: 'Bob Johnson',
          landlord_phone: '+254734567890',
          amenities: ['WiFi', 'Gym', 'Cafeteria']
        }
      ];

      setBookings([...transformedBookings, ...mockBookings]);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'reserved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'reserved':
        return 'text-green-800 bg-green-100';
      case 'pending':
        return 'text-yellow-800 bg-yellow-100';
      case 'cancelled':
        return 'text-red-800 bg-red-100';
      case 'completed':
        return 'text-blue-800 bg-blue-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filterBookings = (bookings: Booking[]) => {
    let filtered = bookings;

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      switch (filters.dateRange) {
        case 'recent':
          filtered = filtered.filter(booking => new Date(booking.created_at) >= thirtyDaysAgo);
          break;
        case 'year':
          filtered = filtered.filter(booking => new Date(booking.created_at) >= oneYearAgo);
          break;
      }
    }

    // Filter by tab
    switch (activeTab) {
      case 'current':
        return filtered.filter(booking => ['confirmed', 'reserved', 'pending'].includes(booking.status));
      case 'past':
        return filtered.filter(booking => ['completed', 'cancelled'].includes(booking.status));
      default:
        return filtered;
    }
  };

  const paginatedBookings = () => {
    const filtered = filterBookings(bookings);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    return filtered.slice(startIndex, endIndex);
  };

  const getTabCounts = () => {
    const current = bookings.filter(b => ['confirmed', 'reserved', 'pending'].includes(b.status)).length;
    const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status)).length;
    return { current, past, total: bookings.length };
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

  const tabCounts = getTabCounts();
  const currentBookings = paginatedBookings();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">Manage your hostel reservations</p>
            </div>
            <Link
              to="/student/browse-hostels"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium"
            >
              Find New Rooms
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => {
                  setActiveTab('current');
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'current'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4" />
                <span>Current ({tabCounts.current})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('past');
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'past'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>Past ({tabCounts.past})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4" />
                <span>All ({tabCounts.total})</span>
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="reserved">Reserved</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => {
                    setFilters({ ...filters, dateRange: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="recent">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            {currentBookings.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {activeTab === 'current' ? 'No current bookings' : 
                   activeTab === 'past' ? 'No past bookings' : 'No bookings found'}
                </p>
                <Link
                  to="/student/browse-hostels"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Browse Hostels
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {currentBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.hostel_name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          {getStatusIcon(booking.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            <span>Room {booking.room_number} • {booking.room_type}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{booking.hostel_address}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <UserGroupIcon className="h-4 w-4" />
                            <span>Landlord: {booking.landlord_name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>Total: {formatCurrency(booking.total_amount)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span>Ref: {booking.booking_reference}</span>
                          <span>Booked: {formatDate(booking.created_at)}</span>
                          {booking.move_in_date && (
                            <span>Move in: {formatDate(booking.move_in_date)}</span>
                          )}
                        </div>

                        {booking.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {booking.amenities.map((amenity, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {booking.balance_due > 0 ? (
                              <span className="text-red-600 font-medium">
                                Balance Due: {formatCurrency(booking.balance_due)}
                              </span>
                            ) : (
                              <span className="text-green-600 font-medium">
                                Fully Paid
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              Paid: {formatCurrency(booking.paid_amount)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <EyeIcon className="h-4 w-4" />
                              <span>Details</span>
                            </button>
                            {['confirmed', 'reserved'].includes(booking.status) && (
                              <button className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg">
                                <span>Cancel</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, bookings.length)} of {bookings.length} bookings
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Booking Reference</label>
                    <p className="text-gray-900">{selectedBooking.booking_reference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hostel</label>
                  <p className="text-gray-900">{selectedBooking.hostel_name}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.hostel_address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room</label>
                    <p className="text-gray-900">{selectedBooking.room_number}</p>
                    <p className="text-sm text-gray-500">{selectedBooking.room_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Move-in Date</label>
                    <p className="text-gray-900">{formatDate(selectedBooking.move_in_date)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Summary</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span>Total Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedBooking.total_amount)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Paid Amount:</span>
                      <span className="text-green-600">{formatCurrency(selectedBooking.paid_amount)}</span>
                    </div>
                    {selectedBooking.balance_due > 0 && (
                      <div className="flex justify-between">
                        <span>Balance Due:</span>
                        <span className="text-red-600 font-medium">{formatCurrency(selectedBooking.balance_due)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Landlord Contact</label>
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    <span>{selectedBooking.landlord_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span>{selectedBooking.landlord_phone}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyBookings;