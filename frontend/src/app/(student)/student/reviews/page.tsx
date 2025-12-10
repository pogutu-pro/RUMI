'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, TrendingUp, Award, MessageSquare, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMyReviews } from '@/lib/api/reviews';
import ReviewCard from '@/components/reviews/review-card';
import RatingStars from '@/components/reviews/rating-stars';

// Review Writing Modal Component
function ReviewWritingModal({
  isOpen,
  onClose,
  hostelId,
  hostelName,
}: {
  isOpen: boolean;
  onClose: () => void;
  hostelId: string;
  hostelName: string;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  const tags = [
    { id: 'cleanliness', label: 'Cleanliness', emoji: '✨' },
    { id: 'wifi', label: 'WiFi', emoji: '📶' },
    { id: 'safety', label: 'Safety', emoji: '🛡️' },
    { id: 'location', label: 'Location', emoji: '📍' },
    { id: 'value', label: 'Value', emoji: '💰' },
    { id: 'landlord', label: 'Landlord', emoji: '👤' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50"
          >
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardHeader className="relative pb-4 bg-gradient-to-br from-emerald-50 to-green-50">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-background/80 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>

                <div className="space-y-2">
                  <CardTitle className="text-2xl text-foreground">Share your experience</CardTitle>
                  <p className="text-sm text-muted-foreground">{hostelName}</p>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Step 1: Rating */}
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-lg font-medium text-foreground">
                      How would you rate your overall experience?
                    </p>
                    <RatingStars
                      rating={rating}
                      onRate={setRating}
                      size="lg"
                      interactive
                      showLabel
                    />
                  </div>
                </div>

                {/* Step 2: Tags */}
                {rating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm font-medium text-foreground">
                      What stood out? (select all that apply)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <motion.button
                          key={tag.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedTags((prev) =>
                              prev.includes(tag.id)
                                ? prev.filter((t) => t !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all font-medium ${
                            selectedTags.includes(tag.id)
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          <span className="text-lg">{tag.emoji}</span>
                          <span>{tag.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Written Review */}
                {rating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Share more details (optional)
                      </p>
                      <span className="text-xs text-gray-500">
                        {comment.length}/500
                      </span>
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 500))}
                      placeholder="What did you love? What could be improved? Help future students make informed decisions..."
                      className="w-full min-h-[120px] p-4 border-2 border-border bg-background rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all resize-none text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-gray-500">
                      Tip: Detailed reviews (50+ characters) are most helpful! 💡
                    </p>
                  </motion.div>
                )}

                {/* Submit */}
                <Button
                  disabled={rating === 0}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg"
                >
                  Post Review ✨
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ReviewsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: myReviews = [], isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: getMyReviews,
  });

  // Mock pending reviews
  const pendingReviews = [
    {
      hostelId: '2',
      hostelName: 'Campus Lodge',
      hostelImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
      moveOutDate: '2023-12-31',
    },
  ];

  // Calculate stats
  const totalReviews = myReviews.length;
  const totalHelpful = myReviews.reduce((sum, r) => sum + (r.helpfulVotes || 0), 0);
  const avgRating = myReviews.length > 0
    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share your experiences, help others decide
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-full">
                <Star className="h-6 w-6 text-emerald-600 fill-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-900">{avgRating}</p>
                <p className="text-sm text-emerald-700">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{totalReviews}</p>
                <p className="text-sm text-blue-700">Reviews Written</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-900">{totalHelpful}</p>
                <p className="text-sm text-amber-700">Helpful Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card className="border-2 border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Ready to Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews.map((review) => (
              <motion.div
                key={review.hostelId}
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-emerald-100 dark:border-emerald-900 shadow-sm"
              >
                <img
                  src={review.hostelImage}
                  alt={review.hostelName}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{review.hostelName}</p>
                  <p className="text-sm text-muted-foreground">
                    Stayed until {new Date(review.moveOutDate).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Write Review
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Your Reviews ({myReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-center py-6 text-muted-foreground">Loading...</p>
          ) : myReviews.length > 0 ? (
            myReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No reviews yet</p>
              <p className="text-sm text-muted-foreground">
                Share your experiences to help other students!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <ReviewWritingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hostelId="2"
        hostelName="Campus Lodge"
      />
    </div>
  );
}
