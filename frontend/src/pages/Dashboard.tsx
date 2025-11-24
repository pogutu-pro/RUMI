import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { authAPI, notificationAPI } from '../services/api';
import {
  BuildingOfficeIcon,
  ShoppingBagIcon,
  UserIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  HomeIcon,
  UsersIcon,
  CogIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect students to their dedicated dashboard
  useEffect(() => {
    if (user?.role === 'student') {
      navigate('/student/dashboard');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get dashboard data based on user role
        let dashboardData;
        if (user?.role === 'student') {
          dashboardData = await authAPI.getDashboard();
          // Use real data from backend
          const data = dashboardData.data;
          setStats([
            { label: 'Active Bookings', value: data.stats.active_bookings.toString(), change: '', positive: true, icon: HomeIcon },
            { label: 'Total Bookings', value: data.stats.total_bookings.toString(), change: '', positive: true, icon: CalendarDaysIcon },
            { label: 'Total Spent', value: `KSh ${data.stats.total_spent.toLocaleString()}`, change: '', positive: true, icon: CurrencyDollarIcon },
            { label: 'Profile Complete', value: `${data.profile.completion_percentage}%`, change: '', positive: true, icon: UserIcon },
          ]);
        } else {
          // For other roles, use default stats until backend APIs are implemented
          setStats(getRoleBasedStats(user?.role));
        }

        // Get recent notifications
        const notificationsResponse = await notificationAPI.getNotifications({ limit: 5 });
        setNotifications(notificationsResponse.data.notifications || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Enhanced error handling with user feedback
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
        console.error(errorMessage);
        // Fallback to default stats
        setStats(getRoleBasedStats(user?.role));
        setNotifications([]);
        // Could add toast notification here for user feedback
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getRoleBasedStats = (role?: string) => {
    switch (role) {
      case 'student':
        return [
          { label: 'Active Bookings', value: '2', change: '+20%', positive: true, icon: HomeIcon },
          { label: 'Items Purchased', value: '8', change: '+15%', positive: true, icon: ShoppingBagIcon },
          { label: 'Total Spent', value: 'KSh 45,000', change: '+8%', positive: true, icon: CurrencyDollarIcon },
          { label: 'Profile Complete', value: '85%', change: '+5%', positive: true, icon: UserIcon },
        ];
      case 'landlord':
        return [
          { label: 'Total Hostels', value: '3', change: '+1', positive: true, icon: BuildingOfficeIcon },
          { label: 'Total Rooms', value: '45', change: '+5', positive: true, icon: HomeIcon },
          { label: 'Monthly Revenue', value: 'KSh 180,000', change: '+12%', positive: true, icon: CurrencyDollarIcon },
          { label: 'Occupancy Rate', value: '92%', change: '+3%', positive: true, icon: ChartBarIcon },
        ];
      case 'caretaker':
        return [
          { label: 'Assigned Hostel', value: 'Green Hostel', change: '', positive: true, icon: BuildingOfficeIcon },
          { label: 'Active Bookings', value: '28', change: '+2', positive: true, icon: CalendarDaysIcon },
          { label: 'Pending Check-ins', value: '3', change: '-1', positive: true, icon: UsersIcon },
          { label: 'Monthly Tasks', value: '45', change: '+8%', positive: true, icon: CogIcon },
        ];
      default:
        return [
          { label: 'Total Users', value: '1,250', change: '+5%', positive: true, icon: UsersIcon },
          { label: 'Active Bookings', value: '89', change: '+12%', positive: true, icon: CalendarDaysIcon },
          { label: 'Revenue Today', value: 'KSh 25,000', change: '+8%', positive: true, icon: CurrencyDollarIcon },
          { label: 'System Health', value: '98%', change: '+1%', positive: true, icon: ChartBarIcon },
        ];
    }
  };

  const getQuickActions = (role?: string) => {
    const commonActions = [
      {
        title: 'My Profile',
        description: 'Manage your account',
        icon: UserIcon,
        href: '/profile',
        color: 'bg-purple-500'
      }
    ];

    switch (role) {
      case 'student':
        return [
          {
            title: 'Find Hostels',
            description: 'Browse available accommodation',
            icon: BuildingOfficeIcon,
            href: '/hostels',
            color: 'bg-blue-500'
          },
          {
            title: 'Marketplace',
            description: 'Buy and sell items',
            icon: ShoppingBagIcon,
            href: '/marketplace',
            color: 'bg-green-500'
          },
          {
            title: 'My Bookings',
            description: 'View your reservations',
            icon: CalendarDaysIcon,
            href: '/bookings',
            color: 'bg-orange-500'
          },
          ...commonActions
        ];
      case 'landlord':
        return [
          {
            title: 'Manage Hostels',
            description: 'Add and manage properties',
            icon: BuildingOfficeIcon,
            href: '/landlord/hostels',
            color: 'bg-blue-500'
          },
          {
            title: 'View Bookings',
            description: 'See all reservations',
            icon: CalendarDaysIcon,
            href: '/landlord/bookings',
            color: 'bg-green-500'
          },
          {
            title: 'Financial Reports',
            description: 'Revenue and payouts',
            icon: CurrencyDollarIcon,
            href: '/landlord/finance',
            color: 'bg-orange-500'
          },
          ...commonActions
        ];
      case 'caretaker':
        return [
          {
            title: 'My Hostel',
            description: 'Manage assigned property',
            icon: BuildingOfficeIcon,
            href: '/caretaker/hostel',
            color: 'bg-blue-500'
          },
          {
            title: 'Check-ins',
            description: 'Process room check-ins',
            icon: UsersIcon,
            href: '/caretaker/checkins',
            color: 'bg-green-500'
          },
          {
            title: 'Maintenance',
            description: 'Report and track issues',
            icon: CogIcon,
            href: '/caretaker/maintenance',
            color: 'bg-orange-500'
          },
          ...commonActions
        ];
      default: // admin
        return [
          {
            title: 'User Management',
            description: 'Manage platform users',
            icon: UsersIcon,
            href: '/admin/users',
            color: 'bg-blue-500'
          },
          {
            title: 'Seller Applications',
            description: 'Review marketplace sellers',
            icon: ShoppingBagIcon,
            href: '/admin/sellers',
            color: 'bg-green-500'
          },
          {
            title: 'System Analytics',
            description: 'Platform metrics',
            icon: ChartBarIcon,
            href: '/admin/analytics',
            color: 'bg-orange-500'
          },
          ...commonActions
        ];
    }
  };

  const getRecentActivities = (role?: string) => {
    switch (role) {
      case 'student':
        return [
          {
            id: 1,
            type: 'booking',
            title: 'Booking confirmed for Green Hostel Room 204',
            time: '2 hours ago',
            status: 'confirmed'
          },
          {
            id: 2,
            type: 'marketplace',
            title: 'Purchased "Calculus Textbook" for KSh 2,500',
            time: '1 day ago',
            status: 'completed'
          },
          {
            id: 3,
            type: 'review',
            title: 'Left a review for Blue Hostel',
            time: '2 days ago',
            status: 'completed'
          }
        ];
      case 'landlord':
        return [
          {
            id: 1,
            type: 'booking',
            title: 'New booking for Ocean View Room 101',
            time: '1 hour ago',
            status: 'pending'
          },
          {
            id: 2,
            type: 'payment',
            title: 'Received payment of KSh 15,000',
            time: '3 hours ago',
            status: 'completed'
          },
          {
            id: 3,
            type: 'maintenance',
            title: 'Maintenance request for Room 205',
            time: '1 day ago',
            status: 'pending'
          }
        ];
      case 'caretaker':
        return [
          {
            id: 1,
            type: 'checkin',
            title: 'Completed check-in for Room 204',
            time: '30 minutes ago',
            status: 'completed'
          },
          {
            id: 2,
            type: 'maintenance',
            title: 'Reported leak in Room 101 bathroom',
            time: '2 hours ago',
            status: 'pending'
          },
          {
            id: 3,
            type: 'inventory',
            title: 'Updated inventory for Room 305',
            time: '1 day ago',
            status: 'completed'
          }
        ];
      default: // admin
        return [
          {
            id: 1,
            type: 'user',
            title: 'New user registration: john.doe@email.com',
            time: '1 hour ago',
            status: 'completed'
          },
          {
            id: 2,
            type: 'seller',
            title: 'Seller application approved for Campus Books',
            time: '2 hours ago',
            status: 'completed'
          },
          {
            id: 3,
            type: 'system',
            title: 'System backup completed successfully',
            time: '1 day ago',
            status: 'completed'
          }
        ];
    }
  };

  const quickActions = getQuickActions(user?.role);
  const recentActivities = getRecentActivities(user?.role);

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Loading Skeleton for Stats */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-24"></div>
                  <div className="h-8 bg-gray-100 rounded animate-pulse mb-2 w-16"></div>
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-32"></div>
                </div>
                <div className="p-3 rounded-full bg-gray-100 animate-pulse ml-4">
                  <div className="w-6 h-6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
          const IconComponent = stat.icon || ChartBarIcon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{stat.value}</p>
                  {stat.change && (
                    <div className={`flex items-center text-xs font-medium ${
                      stat.positive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                    } px-2 py-0.5 rounded-full w-fit mt-2`}>
                      {stat.positive ? '↑' : '↓'} {stat.change}
                      <span className="text-gray-400 ml-1 font-normal">vs last month</span>
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-primary-50 ml-4">
                  <IconComponent className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className="flex items-center p-4 border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group shadow-sm hover:shadow-md"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mr-4 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{action.title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <Link
              to="/analytics"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-6">
            {recentActivities.map((activity, index) => (
              <div key={activity.id} className="relative pl-6 pb-1 last:pb-0">
                {/* Timeline line */}
                {index !== recentActivities.length - 1 && (
                  <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gray-100"></div>
                )}
                
                {/* Status dot */}
                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  activity.status === 'confirmed' ? 'bg-green-500' :
                  activity.status === 'completed' ? 'bg-blue-500' :
                  'bg-amber-500'
                }`}></div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;