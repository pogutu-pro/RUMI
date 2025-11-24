import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../hooks/useCart';
import WishlistButton from './WishlistButton';

interface ProductCardProps {
  product: {
    product_id: number;
    title: string;
    price: number;
    condition: string;
    category: string;
    seller: {
      business_name: string;
      rating: number | null;
      is_verified: boolean;
    };
    images: Array<{
      url: string;
      is_primary: boolean;
    }>;
    location: string | null;
    posted_at: string;
    view_count: number;
    is_negotiable: boolean;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product detail
    e.stopPropagation();

    if (!isAuthenticated) {
      // Could redirect to login or show a message
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart(product.product_id, 1);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

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

  const formatPostedTime = (postedAt: string) => {
    const now = new Date();
    const posted = new Date(postedAt);
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return posted.toLocaleDateString();
  };

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-200">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(product.condition)}`}>
            {product.condition.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-2 left-2">
          <WishlistButton productId={product.product_id} size="sm" />
        </div>

        {/* Negotiable Badge */}
        {product.is_negotiable && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Negotiable
          </div>
        )}

        {/* Multiple Images Indicator */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
            {product.images.length} photos
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
            {product.title}
          </h3>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {product.category}
            </span>
            {product.seller.is_verified && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Seller
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <span className="text-2xl font-bold text-gray-900">
            KES {product.price.toLocaleString()}
          </span>
          {product.is_negotiable && (
            <span className="text-sm text-gray-500 ml-2">(Negotiable)</span>
          )}
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 truncate max-w-32">
              {product.seller.business_name}
            </span>
            {product.seller.rating && (
              <div className="flex items-center ml-2">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-gray-600 ml-1">
                  {product.seller.rating}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Location and Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {product.location || 'Location not specified'}
          </div>

          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {product.view_count} views
          </div>
        </div>

        {/* Posted Time */}
        <div className="text-xs text-gray-400 mb-3">
          Posted {formatPostedTime(product.posted_at)}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link
            to={`/marketplace/product/${product.product_id}`}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 text-center block"
          >
            View Details
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || addedToCart}
            className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              addedToCart
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isAuthenticated ? 'Add to Cart' : 'Login to add to cart'}
          >
            {addedToCart ? (
              <CheckIcon className="w-5 h-5" />
            ) : (
              <ShoppingCartIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;