import React from 'react';
import { UserIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

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

interface ReviewCardProps {
  review: Review;
  onHelpfulClick?: (reviewId: number) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onHelpfulClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* User Info and Rating */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {review.user.profile_picture ? (
              <img
                src={review.user.profile_picture}
                alt={`${review.user.first_name} ${review.user.last_name}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {review.user.first_name} {review.user.last_name}
            </h4>
            <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <StarSolidIcon
              key={i}
              className={`w-5 h-5 ${
                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Review Comment */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
      </div>

      {/* Review Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2">
            {review.photos.map((photo, index) => (
              <img
                key={index}
                src={photo.url}
                alt={`Review photo ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  // Open photo in modal or lightbox
                  window.open(photo.url, '_blank');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Helpful Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onHelpfulClick?.(review.id)}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <HandThumbUpIcon className="w-4 h-4" />
          <span>Helpful ({review.helpful_count || 0})</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;