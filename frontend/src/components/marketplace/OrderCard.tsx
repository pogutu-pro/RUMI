import React from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface OrderItem {
  product_id: number;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
  condition: string;
  category: string;
}

interface OrderCardProps {
  order: {
    order_id: string;
    status: string;
    created_at: string;
    total_amount: number;
    items: OrderItem[];
    buyer_name?: string;
    seller_name?: string;
    shipping_address?: string;
    tracking_number?: string;
  };
  isSellerView?: boolean;
  onStatusUpdate?: (orderId: string, status: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, isSellerView = false, onStatusUpdate }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'shipped':
        return <TruckIcon className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canUpdateStatus = (currentStatus: string) => {
    if (!isSellerView) return false;
    return ['pending', 'confirmed'].includes(currentStatus.toLowerCase());
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Order Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.order_id}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(order.status)}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={item.image_url || '/api/placeholder/60/60'}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/marketplace/product/${item.product_id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                >
                  {item.title}
                </Link>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {item.category}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.condition)}`}>
                    {item.condition.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Qty: {item.quantity} × KES {item.price.toLocaleString()}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                KES {(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">
              {isSellerView ? `Buyer: ${order.buyer_name}` : `Seller: ${order.seller_name}`}
            </div>
            {order.tracking_number && (
              <div className="text-sm text-gray-600">
                Tracking: {order.tracking_number}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              Total: KES {order.total_amount.toLocaleString()}
            </div>
            {canUpdateStatus(order.status) && onStatusUpdate && (
              <div className="mt-2 space-x-2">
                {order.status.toLowerCase() === 'pending' && (
                  <button
                    onClick={() => onStatusUpdate(order.order_id, 'confirmed')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Confirm Order
                  </button>
                )}
                {order.status.toLowerCase() === 'confirmed' && (
                  <button
                    onClick={() => onStatusUpdate(order.order_id, 'shipped')}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                  >
                    Mark as Shipped
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;