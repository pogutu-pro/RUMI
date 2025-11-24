import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, MapPinIcon, CalendarIcon, StarIcon } from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Bookings', value: '12', icon: CalendarIcon },
    { label: 'Reviews Given', value: '8', icon: StarIcon },
    { label: 'Favorite Locations', value: '5', icon: MapPinIcon },
    { label: 'Account Age', value: '6 months', icon: UserIcon },
  ];

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="card p-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {user?.first_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Student Account • Member since January 2024
              </p>
            </div>
            <button className="btn-primary">Edit Profile</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Full Name</span>
                <span className="text-sm text-gray-900">{user?.first_name} {user?.last_name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Email</span>
                <span className="text-sm text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Phone</span>
                <span className="text-sm text-gray-900">+254 700 *** 000</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Account Type</span>
                <span className="text-sm text-gray-900">Student</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-medium text-gray-600">University</span>
                <span className="text-sm text-gray-900">University of Nairobi</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">Active Bookings</p>
                  <p className="text-xs text-green-600">2 current bookings</p>
                </div>
                <span className="text-lg font-bold text-green-600">2</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-800">Items Listed</p>
                  <p className="text-xs text-blue-600">12 active listings</p>
                </div>
                <span className="text-lg font-bold text-blue-600">12</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-purple-800">Total Reviews</p>
                  <p className="text-xs text-purple-600">8 reviews written</p>
                </div>
                <span className="text-lg font-bold text-purple-600">8</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-800">Account Status</p>
                  <p className="text-xs text-orange-600">Verified student</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Booked Green Hostel Room 204', time: '2 days ago', type: 'booking' },
              { action: 'Listed "Calculus Textbook" for sale', time: '1 week ago', type: 'marketplace' },
              { action: 'Left review for Blue Hostel', time: '2 weeks ago', type: 'review' },
              { action: 'Updated profile information', time: '1 month ago', type: 'profile' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'booking' ? 'bg-green-500' :
                  activity.type === 'marketplace' ? 'bg-blue-500' :
                  activity.type === 'review' ? 'bg-purple-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;