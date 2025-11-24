import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { UserIcon, XCircleIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

interface User {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    is_verified: '',
    is_active: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};

      if (filters.role) params.role = filters.role;
      if (filters.is_verified) params.is_verified = filters.is_verified === 'true';
      if (filters.is_active) params.is_active = filters.is_active === 'true';
      if (filters.search) params.search = filters.search;

      const response = await authAPI.getUsers(params);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: number, action: 'activate' | 'deactivate' | 'verify') => {
    setActionLoading(true);
    try {
      if (action === 'deactivate') {
        await authAPI.deactivateUser(userId, { reason: 'Administrative action' });
        setUsers(prev => prev.map(user =>
          user.user_id === userId ? { ...user, is_active: false } : user
        ));
      } else if (action === 'activate') {
        await authAPI.reactivateUser(userId);
        setUsers(prev => prev.map(user =>
          user.user_id === userId ? { ...user, is_active: true } : user
        ));
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'landlord': return 'bg-green-100 text-green-800';
      case 'caretaker': return 'bg-purple-100 text-purple-800';
      case 'tech_support': return 'bg-orange-100 text-orange-800';
      case 'super_admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return user.email.toLowerCase().includes(searchTerm) ||
             user.full_name.toLowerCase().includes(searchTerm);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage platform users and their access</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <UserIcon className="w-5 h-5" />
          <span>{filteredUsers.length} users</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="landlord">Landlord</option>
              <option value="caretaker">Caretaker</option>
              <option value="tech_support">Tech Support</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.is_active}
              onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification</label>
            <select
              value={filters.is_verified}
              onChange={(e) => setFilters(prev => ({ ...prev, is_verified: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by name or email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.is_verified ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {user.is_active ? (
                          <button
                            onClick={() => handleUserAction(user.user_id, 'deactivate')}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Deactivate User"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(user.user_id, 'activate')}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Activate User"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.is_verified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedUser.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.date_joined).toLocaleDateString()}
                  </p>
                </div>
                {selectedUser.last_login && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedUser.last_login).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;