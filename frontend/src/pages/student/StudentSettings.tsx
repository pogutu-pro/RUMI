import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { authAPI } from '../../services/api';
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  booking_updates: boolean;
  payment_reminders: boolean;
  marketing_emails: boolean;
  new_messages: boolean;
  price_alerts: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'students_only';
  show_phone_number: boolean;
  show_email: boolean;
  allow_landlord_contact: boolean;
  share_location: boolean;
  analytics_tracking: boolean;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  login_alerts: boolean;
  session_timeout: number;
  trusted_devices: Array<{
    id: string;
    name: string;
    last_used: string;
    current: boolean;
  }>;
}

const StudentSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Settings states
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    booking_updates: true,
    payment_reminders: true,
    marketing_emails: false,
    new_messages: true,
    price_alerts: true
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile_visibility: 'students_only',
    show_phone_number: false,
    show_email: false,
    allow_landlord_contact: true,
    share_location: false,
    analytics_tracking: true
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: 30,
    trusted_devices: [
      {
        id: '1',
        name: 'Chrome on Windows',
        last_used: '2024-08-15T10:30:00Z',
        current: true
      },
      {
        id: '2',
        name: 'Safari on iPhone',
        last_used: '2024-08-14T15:20:00Z',
        current: false
      }
    ]
  });

  const [accountSettings, setAccountSettings] = useState({
    email: user?.email || '',
    phone: user?.phone_number || '',
    language: 'en',
    timezone: 'Africa/Nairobi',
    currency: 'KES'
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the API
      // For now, we'll use the default values above
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (settingsType: string) => {
    setSaving(true);
    try {
      // In a real app, this would save to the API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert(`${settingsType} settings saved successfully!`);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.new_password.length < 8) {
      alert('New password must be at least 8 characters long!');
      return;
    }

    setSaving(true);
    try {
      // In a real app, this would call the password change API
      await authAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      alert('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real app, this would call the delete account API
      await authAPI.deleteAccount();
      alert('Account deletion initiated. You will receive a confirmation email.');
      setShowDeleteConfirm(false);
      // Redirect to login or logout
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please contact support.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and security</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'account', label: 'Account', icon: UserIcon },
                { id: 'notifications', label: 'Notifications', icon: BellIcon },
                { id: 'privacy', label: 'Privacy', icon: ShieldCheckIcon },
                { id: 'security', label: 'Security', icon: KeyIcon },
                { id: 'devices', label: 'Devices', icon: DevicePhoneMobileIcon }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={accountSettings.email}
                        onChange={(e) => setAccountSettings({...accountSettings, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={accountSettings.phone}
                        onChange={(e) => setAccountSettings({...accountSettings, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={accountSettings.language}
                        onChange={(e) => setAccountSettings({...accountSettings, language: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="sw">Swahili</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={accountSettings.timezone}
                        onChange={(e) => setAccountSettings({...accountSettings, timezone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Africa/Nairobi">Africa/Nairobi</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSettings('Account')}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <hr className="border-gray-200" />

                {/* Password Change */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="grid grid-cols-1 gap-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                
                <div className="space-y-4">
                  {Object.entries({
                    email_notifications: 'Email Notifications',
                    sms_notifications: 'SMS Notifications',
                    push_notifications: 'Push Notifications',
                    booking_updates: 'Booking Updates',
                    payment_reminders: 'Payment Reminders',
                    marketing_emails: 'Marketing Emails',
                    new_messages: 'New Messages',
                    price_alerts: 'Price Alerts'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-700">{label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings[key as keyof NotificationSettings] as boolean}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            [key]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSettings('Notification')}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                    <select
                      value={privacySettings.profile_visibility}
                      onChange={(e) => setPrivacySettings({
                        ...privacySettings,
                        profile_visibility: e.target.value as 'public' | 'private' | 'students_only'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="public">Public - Anyone can see your profile</option>
                      <option value="students_only">Students Only - Only verified students</option>
                      <option value="private">Private - Only you can see your profile</option>
                    </select>
                  </div>

                  {[
                    { key: 'show_phone_number', label: 'Show phone number on profile' },
                    { key: 'show_email', label: 'Show email address on profile' },
                    { key: 'allow_landlord_contact', label: 'Allow landlords to contact you directly' },
                    { key: 'share_location', label: 'Share location for better matching' },
                    { key: 'analytics_tracking', label: 'Allow analytics tracking to improve service' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-700">{label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings[key as keyof PrivacySettings] as boolean}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            [key]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSettings('Privacy')}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-700">Two-Factor Authentication</span>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.two_factor_enabled}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          two_factor_enabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-700">Login Alerts</span>
                      <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.login_alerts}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          login_alerts: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <select
                      value={securitySettings.session_timeout}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        session_timeout: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={480}>8 hours</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSettings('Security')}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Security Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Trusted Devices</h3>
                
                <div className="space-y-4">
                  {securitySettings.trusted_devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DevicePhoneMobileIcon className="h-6 w-6 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{device.name}</p>
                          <p className="text-sm text-gray-500">Last used: {formatDate(device.last_used)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {device.current && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Current Device
                          </span>
                        )}
                        {!device.current && (
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Security Tip</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        If you don't recognize any of these devices, you should change your password immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-red-800">Danger Zone</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and you will lose all your booking history, preferences, and data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentSettings;