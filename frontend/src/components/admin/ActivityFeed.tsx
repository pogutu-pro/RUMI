import React from 'react';
import { UserPlusIcon, ShieldCheckIcon, CreditCardIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface Activity {
  id: number;
  type: 'registration' | 'verification' | 'payment' | 'seller_application';
  message: string;
  timestamp: string;
  user?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return <UserPlusIcon className="w-5 h-5 text-blue-500" />;
      case 'verification':
        return <ShieldCheckIcon className="w-5 h-5 text-green-500" />;
      case 'payment':
        return <CreditCardIcon className="w-5 h-5 text-purple-500" />;
      case 'seller_application':
        return <ShoppingBagIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <UserPlusIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                {activity.user && (
                  <p className="text-xs text-gray-500">by {activity.user}</p>
                )}
                <p className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;