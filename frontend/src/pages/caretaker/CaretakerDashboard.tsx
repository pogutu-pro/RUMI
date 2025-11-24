import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Hostel {
  id: string;
  name: string;
  location: string;
  total_rooms: number;
  occupied_rooms: number;
}

interface CheckIn {
  id: string;
  booking_id: string;
  student_name: string;
  room_number: string;
  checkin_date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface DashboardStats {
  assigned_hostels: number;
  pending_checkins: number;
  completed_checkins_today: number;
  total_inventory_templates: number;
}

const CaretakerDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    assigned_hostels: 0,
    pending_checkins: 0,
    completed_checkins_today: 0,
    total_inventory_templates: 0,
  });
  const [assignedHostels, setAssignedHostels] = useState<Hostel[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Mock data for now - in real implementation, these would come from API endpoints
      // For assigned hostels, we might need a caretaker-specific API
      const mockHostels: Hostel[] = [
        {
          id: '1',
          name: 'Sunset Hostel',
          location: 'Westlands, Nairobi',
          total_rooms: 50,
          occupied_rooms: 45,
        },
        {
          id: '2',
          name: 'Green Valley Hostel',
          location: 'Karen, Nairobi',
          total_rooms: 30,
          occupied_rooms: 28,
        },
      ];

      const mockCheckIns: CheckIn[] = [
        {
          id: '1',
          booking_id: 'BK001',
          student_name: 'John Doe',
          room_number: 'A-101',
          checkin_date: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          booking_id: 'BK002',
          student_name: 'Jane Smith',
          room_number: 'B-205',
          checkin_date: new Date().toISOString(),
          status: 'in_progress',
        },
      ];

      const mockStats: DashboardStats = {
        assigned_hostels: mockHostels.length,
        pending_checkins: mockCheckIns.filter(c => c.status === 'pending').length,
        completed_checkins_today: 3, // Mock value
        total_inventory_templates: 2, // Mock value
      };

      setAssignedHostels(mockHostels);
      setPendingCheckIns(mockCheckIns);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Inventory Management',
      description: 'Create and manage inventory templates',
      icon: WrenchScrewdriverIcon,
      link: '/caretaker/inventory',
      color: 'bg-blue-500',
    },
    {
      title: 'Check-in Verification',
      description: 'Handle student check-ins and verification',
      icon: ClipboardDocumentCheckIcon,
      link: '/caretaker/checkin',
      color: 'bg-green-500',
    },
    {
      title: 'Assigned Hostels',
      description: 'View and manage assigned hostels',
      icon: BuildingOfficeIcon,
      link: '/caretaker/hostels',
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
          <h1 className="text-3xl font-bold text-gray-900">Caretaker Dashboard</h1>
          <p className="text-gray-600">Manage hostels, inventory, and student check-ins</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Hostels</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assigned_hostels}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_checkins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed_checkins_today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <WrenchScrewdriverIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inventory Templates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_inventory_templates}</p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Assigned Hostels and Pending Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Hostels */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Hostels</h3>
          <div className="space-y-3">
            {assignedHostels.map((hostel) => (
              <div key={hostel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{hostel.name}</p>
                  <p className="text-sm text-gray-600">{hostel.location}</p>
                  <p className="text-xs text-gray-500">
                    {hostel.occupied_rooms}/{hostel.total_rooms} rooms occupied
                  </p>
                </div>
                <Link
                  to={`/caretaker/hostels/${hostel.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Check-ins */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Check-ins</h3>
          <div className="space-y-3">
            {pendingCheckIns.map((checkin) => (
              <div key={checkin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{checkin.student_name}</p>
                  <p className="text-sm text-gray-600">Room {checkin.room_number}</p>
                  <p className="text-xs text-gray-500">
                    Status: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      checkin.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      checkin.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {checkin.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
                <Link
                  to={`/caretaker/checkin/${checkin.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Process
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaretakerDashboard;