import React, { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../hooks/useWishlist';

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  className = '',
  size = 'md'
}) => {
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlistByProductId, isInWishlist, loading } = useWishlist();
  const [isProcessing, setIsProcessing] = useState(false);

  const isWishlisted = isInWishlist(productId);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Could redirect to login or show a message
      return;
    }

    if (isProcessing || loading) return;

    try {
      setIsProcessing(true);
      if (isWishlisted) {
        await removeFromWishlistByProductId(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonClasses = `p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 ${
    isWishlisted ? 'text-red-500' : 'text-gray-600'
  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isProcessing || loading}
      className={buttonClasses}
      title={isAuthenticated ? (isWishlisted ? 'Remove from wishlist' : 'Add to wishlist') : 'Login to add to wishlist'}
    >
      {isWishlisted ? (
        <HeartSolidIcon className={sizeClasses[size]} />
      ) : (
        <HeartIcon className={sizeClasses[size]} />
      )}
    </button>
  );
};

export default WishlistButton;