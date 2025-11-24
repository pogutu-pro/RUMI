import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import DashboardStats from '../../components/admin/DashboardStats';
import ActivityFeed from '../../components/admin/ActivityFeed';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UsersIcon, ShieldCheckIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface Activity {
  id: number;
  type: 'registration' | 'verification' | 'payment' | 'seller_application';
  message: string;
  timestamp: string;
  user?: string;
}

interface Stats {
  total_users: number;
  active_landlords: number;
  pending_verifications: number;
  total_revenue: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    active_landlords: 0,
    pending_verifications: 0,
    total_revenue: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats - try admin stats first, fallback to individual endpoints
      let statsData: Stats = {
        total_users: 0,
        active_landlords: 0,
        pending_verifications: 0,
        total_revenue: 0,
      };

      try {
        const statsResponse = await authAPI.getAdminStats();
        statsData = statsResponse.data;
      } catch (error) {
        // Fallback: fetch individual stats
        const [usersResponse, verificationsResponse] = await Promise.all([
          authAPI.getUsers(),
          authAPI.getLandlordVerifications(),
        ]);

        statsData.total_users = usersResponse.data.users?.length || 0;
        statsData.pending_verifications = verificationsResponse.data.filter((v: any) => v.status === 'pending').length || 0;
        statsData.active_landlords = usersResponse.data.users?.filter((u: any) => u.role === 'landlord' && u.is_active).length || 0;
        // Revenue would need to be fetched from payments API
        statsData.total_revenue = 0; // Placeholder
      }

      setStats(statsData);

      // Generate mock activities for now - in real implementation, this would come from an API
      const mockActivities: Activity[] = [
        {
          id: 1,
          type: 'registration',
          message: 'New student registered: john.doe@example.com',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: 'john.doe@example.com',
        },
        {
          id: 2,
          type: 'verification',
          message: 'Landlord verification approved for jane.smith@example.com',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          user: 'jane.smith@example.com',
        },
        {
          id: 3,
          type: 'seller_application',
          message: 'New seller application submitted by bob.wilson@example.com',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: 'bob.wilson@example.com',
        },
        {
          id: 4,
          type: 'payment',
          message: 'Payment received: $150.00 from student booking',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: UsersIcon,
      link: '/admin/users',
      color: 'bg-blue-500',
    },
    {
      title: 'Landlord Verifications',
      description: 'Review and approve landlord applications',
      icon: ShieldCheckIcon,
      link: '/admin/landlord-verification',
      color: 'bg-green-500',
    },
    {
      title: 'Seller Applications',
      description: 'Review marketplace seller applications',
      icon: ShoppingBagIcon,
      link: '/admin/sellers',
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of platform activity and management tools</p>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${action.color}`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={activities} />
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Gateway</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;