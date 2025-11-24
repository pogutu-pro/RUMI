import React, { useState, useEffect } from 'react';
import { StarIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { marketplaceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  helpful_count?: number;
  photos?: Array<{
    url: string;
  }>;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const reviewsPerPage = 5;

  useEffect(() => {
    fetchReviews();
    checkReviewEligibility();
  }, [productId, currentPage, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: reviewsPerPage,
      };

      if (ratingFilter) {
        params.rating = ratingFilter;
      }

      const response = await marketplaceAPI.getProductReviews(productId, params);

      // Assuming the API returns data in this format
      // Adjust based on actual API response structure
      setReviews(response.data.results || response.data.reviews || []);
      setTotalPages(Math.ceil((response.data.count || 0) / reviewsPerPage));
      setTotalReviews(response.data.count || 0);

      // Calculate average rating and distribution
      if (response.data.results || response.data.reviews) {
        const allReviews = response.data.results || response.data.reviews;
        const totalRating = allReviews.reduce((sum: number, review: Review) => sum + review.rating, 0);
        setAverageRating(allReviews.length > 0 ? totalRating / allReviews.length : 0);

        const distribution: Record<number, number> = {};
        allReviews.forEach((review: Review) => {
          distribution[review.rating] = (distribution[review.rating] || 0) + 1;
        });
        setRatingDistribution(distribution);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    if (!user) return;

    try {
      // This would need an API endpoint to check if user can review this product
      // For now, we'll assume they can if they're logged in
      // In a real implementation, you'd check if they have a completed order for this product
      setCanReview(true);
      // Mock order ID - in real implementation, get from API
      setOrderId('mock-order-id');
    } catch (err) {
      console.error('Error checking review eligibility:', err);
      setCanReview(false);
    }
  };

  const handleRatingFilter = (rating: number | null) => {
    setRatingFilter(rating);
    setCurrentPage(1);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    fetchReviews(); // Refresh reviews
    setCanReview(false); // User can no longer review this product
  };

  const handleHelpfulClick = async (reviewId: number) => {
    // This would need an API endpoint to mark review as helpful
    // For now, just show a message
    alert('Thank you for your feedback!');
  };

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    return [...Array(5)].map((_, i) => (
      <StarSolidIcon
        key={i}
        className={`${size} ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderRatingBar = (rating: number, count: number) => {
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium w-8">{rating}★</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600 w-8">{count}</span>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        {canReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && orderId && (
        <ReviewForm
          productId={productId}
          orderId={orderId}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-gray-600">
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div
                  key={rating}
                  className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                  onClick={() => handleRatingFilter(ratingFilter === rating ? null : rating)}
                >
                  {renderRatingBar(rating, ratingDistribution[rating] || 0)}
                </div>
              ))}
            </div>
          </div>

          {/* Clear Filter */}
          {ratingFilter && (
            <div className="mt-4 text-center">
              <button
                onClick={() => handleRatingFilter(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Show all reviews
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpfulClick={handleHelpfulClick}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <StarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">
              {ratingFilter
                ? `No ${ratingFilter}-star reviews found.`
                : 'Be the first to review this product!'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;