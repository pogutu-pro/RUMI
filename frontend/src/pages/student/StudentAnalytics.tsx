import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { authAPI } from '../../services/api';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  bookingStats: {
    total_bookings: number;
    active_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
  };
  spendingStats: {
    total_spent: number;
    average_monthly_spending: number;
    spending_trend: 'up' | 'down' | 'stable';
    spending_by_month: Array<{
      month: string;
      amount: number;
    }>;
  };
  preferences: {
    preferred_room_types: Array<{
      type: string;
      count: number;
    }>;
    preferred_areas: Array<{
      area: string;
      count: number;
    }>;
    price_range: {
      min: number;
      max: number;
      preferred: number;
    };
  };
  activity: {
    last_booking_date: string;
    average_booking_frequency: number;
    profile_completion_score: number;
  };
}

const StudentAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('spending');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock analytics data - in a real app, this would come from the API
      const mockData: AnalyticsData = {
        bookingStats: {
          total_bookings: 8,
          active_bookings: 2,
          completed_bookings: 5,
          cancelled_bookings: 1
        },
        spendingStats: {
          total_spent: 135000,
          average_monthly_spending: 22500,
          spending_trend: 'up',
          spending_by_month: [
            { month: 'Jan', amount: 18000 },
            { month: 'Feb', amount: 20000 },
            { month: 'Mar', amount: 15000 },
            { month: 'Apr', amount: 25000 },
            { month: 'May', amount: 22000 },
            { month: 'Jun', amount: 20000 },
            { month: 'Jul', amount: 0 },
            { month: 'Aug', amount: 15000 }
          ]
        },
        preferences: {
          preferred_room_types: [
            { type: 'Single Room', count: 6 },
            { type: 'Shared Room', count: 2 },
            { type: 'Studio', count: 0 }
          ],
          preferred_areas: [
            { area: 'University Area', count: 5 },
            { area: 'City Center', count: 2 },
            { area: 'Suburbs', count: 1 }
          ],
          price_range: {
            min: 12000,
            max: 25000,
            preferred: 18000
          }
        },
        activity: {
          last_booking_date: '2024-08-15',
          average_booking_frequency: 2.1,
          profile_completion_score: 85
        }
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Chart configurations
  const spendingChartData = {
    labels: analyticsData?.spendingStats.spending_by_month.map(item => item.month) || [],
    datasets: [
      {
        label: 'Monthly Spending',
        data: analyticsData?.spendingStats.spending_by_month.map(item => item.amount) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const roomTypeData = {
    labels: analyticsData?.preferences.preferred_room_types.map(item => item.type) || [],
    datasets: [
      {
        data: analyticsData?.preferences.preferred_room_types.map(item => item.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const areaData = {
    labels: analyticsData?.preferences.preferred_areas.map(item => item.area) || [],
    datasets: [
      {
        label: 'Bookings by Area',
        data: analyticsData?.preferences.preferred_areas.map(item => item.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'KSh ' + value.toLocaleString();
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
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

  if (!analyticsData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load analytics data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
              <p className="text-gray-600 mt-1">Track your booking patterns and spending</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="3months">Last 3 months</option>
                <option value="6months">Last 6 months</option>
                <option value="1year">Last year</option>
                <option value="all">All time</option>
              </select>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.bookingStats.total_bookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analyticsData.spendingStats.total_spent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Monthly</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(analyticsData.spendingStats.average_monthly_spending)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Profile Score</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.activity.profile_completion_score}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Selector */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Spending Overview</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedMetric('spending')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedMetric === 'spending'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Spending
              </button>
              <button
                onClick={() => setSelectedMetric('bookings')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedMetric === 'bookings'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bookings
              </button>
            </div>
          </div>

          <div className="h-80">
            <Line data={spendingChartData} options={chartOptions} />
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Room Type Preferences */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Type Preferences</h3>
            <div className="h-64">
              <Doughnut data={roomTypeData} options={doughnutOptions} />
            </div>
            <div className="mt-4 space-y-2">
              {analyticsData.preferences.preferred_room_types.map((room, index) => (
                <div key={room.type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{room.type}</span>
                  <span className="text-sm font-medium text-gray-900">{room.count} bookings</span>
                </div>
              ))}
            </div>
          </div>

          {/* Area Preferences */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Area Preferences</h3>
            <div className="h-64">
              <Bar data={areaData} options={chartOptions} />
            </div>
            <div className="mt-4 space-y-2">
              {analyticsData.preferences.preferred_areas.map((area, index) => (
                <div key={area.area} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{area.area}</span>
                  <span className="text-sm font-medium text-gray-900">{area.count} bookings</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">💡 Spending Insights</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Your spending has increased by 15% compared to last period</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>You're spending 8% above the average student budget</span>
                </li>
                <li className="flex items-start space-x-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-purple-600 mt-0.5" />
                  <span>Single rooms account for 75% of your bookings</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <EyeIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Consider shared rooms to reduce costs by up to 30%</span>
                </li>
                <li className="flex items-start space-x-2">
                  <MapPinIcon className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Explore University Area for more affordable options</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CalendarDaysIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span>Book early to get better rates and availability</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatDate(analyticsData.activity.last_booking_date)}
              </div>
              <div className="text-sm text-gray-500">Last Booking</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.activity.average_booking_frequency.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">Avg Bookings/Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                KSh {analyticsData.preferences.price_range.preferred.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Preferred Price Range</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/student/bookings"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">View All Bookings</p>
                <p className="text-sm text-gray-500">Manage current reservations</p>
              </div>
            </Link>
            <Link
              to="/student/profile"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <ChartBarIcon className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Complete Profile</p>
                <p className="text-sm text-gray-500">Improve your matching score</p>
              </div>
            </Link>
            <Link
              to="/student/browse-hostels"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Find New Rooms</p>
                <p className="text-sm text-gray-500">Explore more options</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAnalytics;