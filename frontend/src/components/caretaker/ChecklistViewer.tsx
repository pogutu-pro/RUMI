import React, { useState } from 'react';

interface ChecklistItem {
  name: string;
  checked: boolean;
  notes: string;
}

interface ChecklistCategory {
  name: string;
  items: ChecklistItem[];
}

interface ChecklistData {
  categories: ChecklistCategory[];
}

interface CheckIn {
  id: string;
  booking_id: string;
  student_name: string;
  student_email: string;
  room_number: string;
  hostel_name: string;
  checkin_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  checklist_data?: ChecklistData;
}

interface ChecklistViewerProps {
  checkIn: CheckIn;
  onSubmit: (checklistData: ChecklistData) => Promise<void>;
  onVerify: () => Promise<void>;
}

const ChecklistViewer: React.FC<ChecklistViewerProps> = ({
  checkIn,
  onSubmit,
  onVerify,
}) => {
  const [checklistData, setChecklistData] = useState<ChecklistData>(
    checkIn.checklist_data || {
      categories: [
        {
          name: 'Room Condition',
          items: [
            { name: 'Walls clean', checked: false, notes: '' },
            { name: 'Floor clean', checked: false, notes: '' },
            { name: 'Windows intact', checked: false, notes: '' },
            { name: 'Doors working', checked: false, notes: '' },
            { name: 'Electrical outlets functional', checked: false, notes: '' },
            { name: 'Lights working', checked: false, notes: '' },
          ],
        },
        {
          name: 'Furniture & Fixtures',
          items: [
            { name: 'Bed and mattress present', checked: false, notes: '' },
            { name: 'Chair/Desk present', checked: false, notes: '' },
            { name: 'Wardrobe/Cupboard present', checked: false, notes: '' },
            { name: 'Curtains/Blinds present', checked: false, notes: '' },
          ],
        },
        {
          name: 'Utilities & Amenities',
          items: [
            { name: 'Water supply working', checked: false, notes: '' },
            { name: 'Toilet functioning', checked: false, notes: '' },
            { name: 'Shower/Bathroom clean', checked: false, notes: '' },
            { name: 'WiFi available', checked: false, notes: '' },
          ],
        },
        {
          name: 'Safety & Security',
          items: [
            { name: 'Smoke detector present', checked: false, notes: '' },
            { name: 'Fire extinguisher accessible', checked: false, notes: '' },
            { name: 'Room lock working', checked: false, notes: '' },
            { name: 'Emergency exits clear', checked: false, notes: '' },
          ],
        },
      ],
    }
  );
  const [loading, setLoading] = useState(false);

  const updateItem = (
    categoryIndex: number,
    itemIndex: number,
    field: 'checked' | 'notes',
    value: boolean | string
  ) => {
    const updatedData = { ...checklistData };
    updatedData.categories[categoryIndex].items[itemIndex] = {
      ...updatedData.categories[categoryIndex].items[itemIndex],
      [field]: value,
    };
    setChecklistData(updatedData);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(checklistData);
    } catch (error) {
      console.error('Failed to submit checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await onVerify();
    } catch (error) {
      console.error('Failed to verify check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    const totalItems = checklistData.categories.reduce(
      (total, category) => total + category.items.length,
      0
    );
    const checkedItems = checklistData.categories.reduce(
      (total, category) => total + category.items.filter(item => item.checked).length,
      0
    );
    return totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  };

  const canSubmit = checklistData.categories.some(category =>
    category.items.some(item => item.checked)
  );

  return (
    <div className="space-y-6">
      {/* Check-in Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Check-in Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Student:</span> {checkIn.student_name}
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span> {checkIn.student_email}
          </div>
          <div>
            <span className="font-medium text-gray-700">Room:</span> {checkIn.room_number}
          </div>
          <div>
            <span className="font-medium text-gray-700">Hostel:</span> {checkIn.hostel_name}
          </div>
          <div>
            <span className="font-medium text-gray-700">Date:</span> {new Date(checkIn.checkin_date).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              checkIn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              checkIn.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              checkIn.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {checkIn.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-700">Checklist Progress</span>
          <span className="text-sm font-medium text-blue-700">{getCompletionPercentage()}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist Categories */}
      <div className="space-y-6">
        {checklistData.categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">{category.name}</h4>
            <div className="space-y-3">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => updateItem(categoryIndex, itemIndex, 'checked', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">{item.name}</label>
                    <textarea
                      value={item.notes}
                      onChange={(e) => updateItem(categoryIndex, itemIndex, 'notes', e.target.value)}
                      placeholder="Add notes (optional)"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        {checkIn.status === 'in_progress' && (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Checklist'}
          </button>
        )}

        {checkIn.status === 'completed' && (
          <button
            onClick={handleVerify}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Check-in'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChecklistViewer;