import React, { useState, useEffect } from 'react';
import { StarIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { marketplaceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewFormProps {
  productId: string;
  orderId: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  orderId,
  onReviewSubmitted,
  onCancel
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files);
      setPhotos(prev => [...prev, ...newPhotos]);

      // Create preview URLs
      const newUrls = newPhotos.map(file => URL.createObjectURL(file));
      setPhotoUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoUrls[index]);
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('rating', rating.toString());
      formData.append('comment', comment.trim());

      // Add photos if any
      photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });

      await marketplaceAPI.submitReview(orderId, formData);

      // Clean up object URLs
      photoUrls.forEach(url => URL.revokeObjectURL(url));

      onReviewSubmitted();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photoUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoUrls]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
              >
                {(hoverRating || rating) >= value ? (
                  <StarSolidIcon className="w-8 h-8 text-yellow-400" />
                ) : (
                  <StarIcon className="w-8 h-8 text-gray-300" />
                )}
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (Optional)
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <PhotoIcon className="w-8 h-8 text-gray-400" />
            </label>

            {/* Photo Previews */}
            {photoUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            You can upload up to 5 photos. Max file size: 5MB each.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;