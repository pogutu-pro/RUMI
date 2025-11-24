import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, HeartIcon, ExclamationTriangleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Wishlist: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { wishlist, loading, error, removeFromWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    }
  }, [isAuthenticated, refreshWishlist]);

  const handleRemoveFromWishlist = async (itemId: number) => {
    await removeFromWishlist(itemId);
  };

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId, 1);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your wishlist.
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

  if (loading && !wishlist) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Wishlist</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refreshWishlist}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
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

        {/* Empty Wishlist */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <HeartIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Save items you love for later. Start browsing and add products to your wishlist!
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
              My Wishlist ({wishlist.total_items} {wishlist.total_items === 1 ? 'item' : 'items'})
            </h1>
          </div>
        </div>
      </div>

      {/* Wishlist Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />

                {/* Remove from Wishlist Button */}
                <button
                  onClick={() => handleRemoveFromWishlist(item.id)}
                  className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-md transition-all duration-200"
                  title="Remove from wishlist"
                >
                  <HeartIcon className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <Link to={`/marketplace/product/${item.product_id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {item.category}
                  </span>
                </div>

                <p className="text-2xl font-bold text-gray-900 mb-3">
                  KES {item.price.toLocaleString()}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                    {item.seller_name}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    to={`/marketplace/product/${item.product_id}`}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 text-center block"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleAddToCart(item.product_id)}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                    title="Add to Cart"
                  >
                    <ShoppingBagIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Shopping */}
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

export default Wishlist;