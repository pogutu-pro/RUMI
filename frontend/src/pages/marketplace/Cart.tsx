import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ShoppingBagIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../hooks/useCart';
import CartItem from '../../components/marketplace/CartItem';
import CartSummary from '../../components/marketplace/CartSummary';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Cart: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { cart, loading, error, updateQuantity, removeItem, refreshCart } = useCart();

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your cart.
          </p>
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Cart</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refreshCart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/marketplace" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBagIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              to="/marketplace"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/marketplace" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              Shopping Cart ({cart.total_items} {cart.total_items === 1 ? 'item' : 'items'})
            </h1>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                loading={loading}
              />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary cart={cart} loading={loading} />
          </div>
        </div>
      </div>

      {/* Recently Viewed or Recommendations */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Link
              to="/marketplace"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;