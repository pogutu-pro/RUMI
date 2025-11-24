import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, dateRange, updateDateRange } = useAnalytics();
  const [localDateRange, setLocalDateRange] = useState(dateRange);

  // Admin-only access
  if (!user || user.role !== 'super_admin') {
    return (
      <DashboardLayout title="Analytics & Insights">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin privileges to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Transform data for charts
  const monthlyRevenueData = {
    labels: data.revenue?.monthly_data?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Monthly Revenue (KSh)',
        data: data.revenue?.monthly_data?.map(item => item.revenue) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const userRegistrationData = {
    labels: data.users?.monthly_registrations?.map(item => item.month) || [],
    datasets: [
      {
        label: 'New Registrations',
        data: data.users?.monthly_registrations?.map(item => item.count) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const productCategoryData = {
    labels: data.products?.top_categories?.map(item => item.category) || [],
    datasets: [
      {
        data: data.products?.top_categories?.map(item => item.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const handleDateRangeChange = () => {
    updateDateRange(localDateRange);
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: data.revenue ? `KSh ${data.revenue.total_revenue.toLocaleString()}` : 'Loading...',
      change: data.revenue ? `+${data.revenue.growth_percentage}%` : '',
      positive: true
    },
    {
      label: 'Total Users',
      value: data.users ? data.users.total_users.toString() : 'Loading...',
      change: data.users ? `+${data.users.new_registrations}` : '',
      positive: true
    },
    {
      label: 'Active Users',
      value: data.users ? data.users.active_users.toString() : 'Loading...',
      change: '',
      positive: true
    },
    {
      label: 'Total Products',
      value: data.products ? data.products.total_products.toString() : 'Loading...',
      change: data.products ? `+${data.products.total_sales} sales` : '',
      positive: true
    },
  ];

  return (
    <DashboardLayout title="Analytics & Insights">
      {/* Date Range Filter */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range Filter</h3>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={localDateRange.startDate}
              onChange={(e) => setLocalDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={localDateRange.endDate}
              onChange={(e) => setLocalDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleDateRangeChange}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <p className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last period
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Revenue Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <div className="h-80">
            {loading.revenue ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : (
              <Line data={monthlyRevenueData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* User Registration Trends */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Trends</h3>
          <div className="h-80">
            {loading.users ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : (
              <Bar data={userRegistrationData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products by Category */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
          <div className="h-80 flex items-center justify-center">
            {loading.products ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : (
              <Doughnut data={productCategoryData} options={doughnutOptions} />
            )}
          </div>
        </div>

        {/* Insights Panel */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">Revenue Growth</p>
                  <p className="text-xs text-green-600">
                    Revenue has {data.revenue?.growth_percentage ? `increased by ${data.revenue.growth_percentage}%` : 'grown steadily'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-blue-800">User Activity</p>
                  <p className="text-xs text-blue-600">
                    {data.users?.active_users || 0} active users out of {data.users?.total_users || 0} total users
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-purple-800">Marketplace Performance</p>
                  <p className="text-xs text-purple-600">
                    {data.products?.total_products || 0} products with {data.products?.total_sales || 0} total sales
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-orange-800">Top Category</p>
                  <p className="text-xs text-orange-600">
                    {data.products?.top_categories?.[0]?.category || 'N/A'} leads with {data.products?.top_categories?.[0]?.count || 0} products
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default Analytics;