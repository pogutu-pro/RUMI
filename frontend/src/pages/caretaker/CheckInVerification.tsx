import React, { useState, useEffect } from 'react';
import { hostelAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ChecklistViewer from '../../components/caretaker/ChecklistViewer';

interface CheckIn {
  id: string;
  booking_id: string;
  student_name: string;
  student_email: string;
  room_number: string;
  hostel_name: string;
  checkin_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  checklist_data?: any;
}

interface Hostel {
  id: string;
  name: string;
  location: string;
}

const CheckInVerification: React.FC = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<string>('');
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    if (selectedHostel) {
      fetchCheckIns(selectedHostel);
    }
  }, [selectedHostel]);

  const fetchHostels = async () => {
    try {
      // Mock data for assigned hostels
      const mockHostels: Hostel[] = [
        {
          id: '1',
          name: 'Sunset Hostel',
          location: 'Westlands, Nairobi',
        },
        {
          id: '2',
          name: 'Green Valley Hostel',
          location: 'Karen, Nairobi',
        },
      ];
      setHostels(mockHostels);
    } catch (error) {
      console.error('Failed to fetch hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckIns = async (hostelId: string) => {
    try {
      setLoading(true);
      // Mock data for check-ins - in real implementation, this would come from an API
      const mockCheckIns: CheckIn[] = [
        {
          id: '1',
          booking_id: 'BK001',
          student_name: 'John Doe',
          student_email: 'john.doe@example.com',
          room_number: 'A-101',
          hostel_name: hostels.find(h => h.id === hostelId)?.name || 'Unknown Hostel',
          checkin_date: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          booking_id: 'BK002',
          student_name: 'Jane Smith',
          student_email: 'jane.smith@example.com',
          room_number: 'B-205',
          hostel_name: hostels.find(h => h.id === hostelId)?.name || 'Unknown Hostel',
          checkin_date: new Date().toISOString(),
          status: 'in_progress',
          checklist_data: {
            categories: [
              {
                name: 'Room Condition',
                items: [
                  { name: 'Walls clean', checked: true, notes: 'Good condition' },
                  { name: 'Floor clean', checked: true, notes: '' },
                  { name: 'Windows intact', checked: false, notes: 'One window cracked' },
                ],
              },
            ],
          },
        },
        {
          id: '3',
          booking_id: 'BK003',
          student_name: 'Bob Wilson',
          student_email: 'bob.wilson@example.com',
          room_number: 'C-102',
          hostel_name: hostels.find(h => h.id === hostelId)?.name || 'Unknown Hostel',
          checkin_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          status: 'completed',
        },
      ];
      setCheckIns(mockCheckIns);
    } catch (error) {
      console.error('Failed to fetch check-ins:', error);
      setCheckIns([]);
    } finally {
      setLoading(false);
    }
  };

  const startCheckIn = async (bookingId: string) => {
    try {
      await hostelAPI.startInventoryCheckIn(bookingId);
      // Refresh check-ins after starting
      if (selectedHostel) {
        fetchCheckIns(selectedHostel);
      }
    } catch (error) {
      console.error('Failed to start check-in:', error);
    }
  };

  const submitChecklist = async (checkinId: string, checklistData: any) => {
    try {
      await hostelAPI.submitInventoryCheckIn(checkinId, checklistData);
      setSelectedCheckIn(null);
      if (selectedHostel) {
        fetchCheckIns(selectedHostel);
      }
    } catch (error) {
      console.error('Failed to submit checklist:', error);
      throw error;
    }
  };

  const verifyCheckIn = async (checkinId: string) => {
    try {
      await hostelAPI.verifyInventoryCheckIn(checkinId, { verified: true });
      setSelectedCheckIn(null);
      if (selectedHostel) {
        fetchCheckIns(selectedHostel);
      }
    } catch (error) {
      console.error('Failed to verify check-in:', error);
      throw error;
    }
  };

  const filteredCheckIns = checkIns.filter(checkin => {
    if (filter === 'all') return true;
    return checkin.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !selectedHostel) {
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
          <h1 className="text-3xl font-bold text-gray-900">Check-in Verification</h1>
          <p className="text-gray-600">Manage student check-ins and verify room conditions</p>
        </div>
      </div>

      {/* Hostel Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Hostel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hostels.map((hostel) => (
            <div
              key={hostel.id}
              onClick={() => setSelectedHostel(hostel.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedHostel === hostel.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{hostel.name}</h3>
              <p className="text-sm text-gray-600">{hostel.location}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedHostel && (
        <>
          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">Check-ins</h2>
                <div className="flex items-center space-x-2">
                  <label htmlFor="filter" className="text-sm text-gray-600">Filter:</label>
                  <select
                    id="filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {filteredCheckIns.length} check-in{filteredCheckIns.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Check-ins List */}
          <div className="bg-white rounded-lg shadow p-6">
            {loading ? (
              <LoadingSpinner size="md" />
            ) : filteredCheckIns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No check-ins found for the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCheckIns.map((checkin) => (
                  <div key={checkin.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{checkin.student_name}</h3>
                        <p className="text-sm text-gray-600">{checkin.student_email}</p>
                        <p className="text-sm text-gray-600">
                          Room {checkin.room_number} • {checkin.hostel_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(checkin.status)}`}>
                          {checkin.status.replace('_', ' ')}
                        </span>
                        <div className="flex space-x-2">
                          {checkin.status === 'pending' && (
                            <button
                              onClick={() => startCheckIn(checkin.booking_id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                            >
                              Start Check-in
                            </button>
                          )}
                          {(checkin.status === 'in_progress' || checkin.status === 'completed') && (
                            <button
                              onClick={() => setSelectedCheckIn(checkin)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
                            >
                              View Checklist
                            </button>
                          )}
                          {checkin.status === 'completed' && (
                            <button
                              onClick={() => verifyCheckIn(checkin.id)}
                              className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 text-sm"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Check-in date: {new Date(checkin.checkin_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Checklist Viewer Modal */}
      {selectedCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Check-in Checklist - {selectedCheckIn.student_name}
              </h2>
              <button
                onClick={() => setSelectedCheckIn(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <ChecklistViewer
              checkIn={selectedCheckIn}
              onSubmit={(checklistData) => submitChecklist(selectedCheckIn.id, checklistData)}
              onVerify={() => verifyCheckIn(selectedCheckIn.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInVerification;