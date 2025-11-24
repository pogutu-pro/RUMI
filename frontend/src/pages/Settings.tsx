import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, BellIcon, ShieldCheckIcon, CreditCardIcon } from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
  ];

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.first_name}
                    className="input-field"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.last_name}
                    className="input-field"
                    placeholder="Enter your last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Booking Reminders</h4>
                    <p className="text-sm text-gray-600">Get reminded about upcoming bookings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Marketplace Alerts</h4>
                    <p className="text-sm text-gray-600">Notifications about marketplace activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
                    <p className="text-sm text-gray-600">Receive weekly activity summaries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Change Password</h4>
                  <div className="space-y-4">
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Current password"
                    />
                    <input
                      type="password"
                      className="input-field"
                      placeholder="New password"
                    />
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button className="btn-primary mt-4">Update Password</button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn-secondary">Enable 2FA</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Billing & Payments</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Current Plan</h4>
                    <p className="text-sm text-gray-600">Free Plan</p>
                  </div>
                  <button className="btn-primary">Upgrade</button>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Payment Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-bold">M</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">M-Pesa</p>
                          <p className="text-xs text-gray-600">+254 700 *** 000</p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Default</span>
                    </div>
                  </div>
                  <button className="btn-secondary mt-4">Add Payment Method</button>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Billing History</h4>
                  <div className="text-center py-8 text-gray-500">
                    <p>No billing history available</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;