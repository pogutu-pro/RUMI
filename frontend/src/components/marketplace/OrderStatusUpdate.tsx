import React, { useState } from 'react';
import { XMarkIcon, TruckIcon } from '@heroicons/react/24/outline';
import { marketplaceAPI } from '../../services/api';

interface OrderStatusUpdateProps {
  orderId: string;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const OrderStatusUpdate: React.FC<OrderStatusUpdateProps> = ({
  orderId,
  currentStatus,
  isOpen,
  onClose,
  onStatusUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'confirmed', label: 'Confirm Order', description: 'Mark order as confirmed and ready for processing' },
    { value: 'shipped', label: 'Mark as Shipped', description: 'Order has been shipped and tracking information is available' },
  ];

  const availableStatuses = statusOptions.filter(option => {
    if (currentStatus.toLowerCase() === 'pending' && option.value === 'confirmed') return true;
    if (currentStatus.toLowerCase() === 'confirmed' && option.value === 'shipped') return true;
    return false;
  });

  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError('');

      if (newStatus === 'shipped') {
        // For shipped status, we need to call the ship endpoint
        await marketplaceAPI.markOrderShipped(orderId);
      } else {
        // For other status updates
        await marketplaceAPI.updateOrderStatus(orderId, newStatus);
      }

      onStatusUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Update Order Status
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Order #{orderId}
            </p>
            <p className="text-sm text-gray-600">
              Current Status: <span className="font-medium capitalize">{currentStatus}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {availableStatuses.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusUpdate(status.value)}
                disabled={loading}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center space-x-3">
                  <TruckIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{status.label}</p>
                    <p className="text-sm text-gray-600">{status.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {availableStatuses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No status updates available for this order.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusUpdate;