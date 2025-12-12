'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewCard, RatingBreakdown, ReviewFilterTabs } from '@/features/reviews';
import type { Review, ReviewFilters } from '@/types/entities.types';

interface HostelReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

export default function HostelReviewsSection({
  reviews,
  averageRating,
  reviewCount,
}: HostelReviewsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ReviewFilters['sort']>('helpful');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const displayCount = reviewCount || reviews.length;
  
  // Calculate recommendation rate (4+ stars)
  const recommendationRate = reviews.length > 0
    ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)
    : 0;
  
  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];
    
    // Apply verified filter
    if (verifiedOnly) {
      filtered = filtered.filter(r => r.verifiedStay);
    }
    
    // Apply sorting
    switch (activeFilter) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'helpful':
        filtered.sort((a, b) => (b.helpfulVotes || 0) - (a.helpfulVotes || 0));
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
    }
    
    return filtered;
  }, [reviews, activeFilter, verifiedOnly]);
  
  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 6);
  
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-8"
    >
      {/* Rating Header - Clean, bold, social */}
      <div className="mb-8 space-y-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Left: Big bold score */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </h2>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(averageRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {displayCount} {displayCount === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
            
            {/* Recommendation rate */}
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                {recommendationRate}% recommend this hostel
              </span>
            </div>
          </div>
          
          {/* Right: Rating breakdown */}
          <div className="flex-1 min-w-[280px] max-w-md">
            <RatingBreakdown reviews={reviews} />
          </div>
        </div>
      </div>
      
      {/* Filter Tabs - Instagram style */}
      <ReviewFilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        verifiedOnly={verifiedOnly}
        onVerifiedToggle={() => setVerifiedOnly(!verifiedOnly)}
      />
      
      {/* Reviews Grid */}
      <div className="mt-6 space-y-4">
        {displayedReviews.length > 0 ? (
          <>
            {displayedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onHelpfulToggle={() => {
                  // TODO: Implement helpful vote
                  console.log('Helpful vote for', review.id);
                }}
                onReact={(emoji) => {
                  // TODO: Implement emoji reaction
                  console.log('React with', emoji, 'to', review.id);
                }}
              />
            ))}
            
            {/* Load More Button */}
            {filteredReviews.length > 6 && !showAll && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setShowAll(true)}
                  variant="outline"
                  size="lg"
                  className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 text-gray-900 font-medium rounded-full px-8"
                >
                  Show all {filteredReviews.length} reviews
                </Button>
              </div>
            )}
            
            {showAll && filteredReviews.length > 6 && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => {
                    setShowAll(false);
                    // Scroll to reviews section
                    document.getElementById('reviews-section')?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }}
                  variant="outline"
                  size="lg"
                  className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 text-gray-900 font-medium rounded-full px-8"
                >
                  Show less
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-500">
              No reviews match your filters. Try adjusting your selection.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
