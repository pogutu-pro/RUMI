import React from 'react';
import { Link } from 'react-router-dom';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { CartItem as CartItemType } from '../../hooks/useCart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: number, quantity: number) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
  loading?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  loading = false
}) => {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'like_new':
        return 'bg-blue-100 text-blue-800';
      case 'good':
        return 'bg-yellow-100 text-yellow-800';
      case 'fair':
        return 'bg-orange-100 text-orange-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > 99) return; // Max quantity limit
    await onUpdateQuantity(item.id, newQuantity);
  };

  const handleRemove = async () => {
    await onRemove(item.id);
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <Link to={`/marketplace/product/${item.product_id}`}>
          <img
            src={item.image_url || '/api/placeholder/80/80'}
            alt={item.title}
            className="w-20 h-20 object-cover rounded-lg hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/marketplace/product/${item.product_id}`}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
        >
          {item.title}
        </Link>

        <div className="flex items-center space-x-2 mt-1">
          <span className="text-sm text-gray-600">by {item.seller_name}</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
            {item.condition.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {item.category}
          </span>
        </div>

        <div className="mt-2">
          <span className="text-xl font-bold text-gray-900">
            KES {item.price.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 ml-2">
            each
          </span>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={loading || item.quantity <= 1}
          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MinusIcon className="w-4 h-4" />
        </button>

        <span className="w-12 text-center font-medium">
          {item.quantity}
        </span>

        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={loading || item.quantity >= 99}
          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right">
        <div className="text-lg font-bold text-gray-900">
          KES {(item.price * item.quantity).toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">
          subtotal
        </div>
      </div>

      {/* Remove Button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleRemove}
          disabled={loading}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove item"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CartItem;