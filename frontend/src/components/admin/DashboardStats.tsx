import React from 'react';
import { UsersIcon, BuildingOfficeIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  stats: {
    total_users: number;
    active_landlords: number;
    pending_verifications: number;
    total_revenue: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Landlords',
      value: stats.active_landlords,
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Verifications',
      value: stats.pending_verifications,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.total_revenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;