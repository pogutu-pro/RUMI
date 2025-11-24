import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBagIcon, TruckIcon } from '@heroicons/react/24/outline';
import type { Cart } from '../../hooks/useCart';

interface CartSummaryProps {
  cart: Cart;
  loading?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({ cart, loading = false }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

      {/* Item Count */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <span className="text-gray-600">
          {cart.total_items} {cart.total_items === 1 ? 'item' : 'items'}
        </span>
        <span className="font-medium text-gray-900">
          KES {cart.subtotal.toLocaleString()}
        </span>
      </div>

      {/* Subtotal */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium text-gray-900">
          KES {cart.subtotal.toLocaleString()}
        </span>
      </div>

      {/* Tax */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600">Tax</span>
        <span className="font-medium text-gray-900">
          KES {cart.tax.toLocaleString()}
        </span>
      </div>

      {/* Shipping */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <TruckIcon className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-gray-600">Shipping</span>
        </div>
        <span className="text-green-600 font-medium">Free</span>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-lg font-semibold text-gray-900">Total</span>
        <span className="text-2xl font-bold text-gray-900">
          KES {cart.total.toLocaleString()}
        </span>
      </div>

      {/* Checkout Button */}
      <Link
        to="/checkout"
        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={(e) => {
          if (loading) {
            e.preventDefault();
          }
        }}
      >
        <ShoppingBagIcon className="w-5 h-5 mr-2" />
        Proceed to Checkout
      </Link>

      {/* Additional Info */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Secure checkout powered by Paystack
        </p>
      </div>

      {/* Continue Shopping */}
      <div className="mt-4 text-center">
        <Link
          to="/marketplace"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Continue Shopping →
        </Link>
      </div>

      {/* Cart Benefits */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
            <span>Free shipping on all orders</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
            <span>30-day return policy</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
            <span>Secure payment processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;