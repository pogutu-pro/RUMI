'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Review, ReviewReaction } from '@/types/entities.types';

// Import our new components
import VerifiedStayBadge from './verified-stay-badge';
import ReviewTagChip from './review-tag-chip';
import EmojiReactions from './emoji-reactions';
import HelpfulButton from './helpful-button';
import { RatingStars } from './rating-stars';
import ReviewStatusBadge, { ShortReviewBadge } from './review-status-badge';
import LandlordResponseCard from './landlord-response-card';

interface ReviewCardProps {
  review: Review;
  onHelpfulToggle?: () => void;
  onReact?: (emoji: ReviewReaction['emoji']) => void;
  isHelpful?: boolean;
}

export function ReviewCard({ 
  review, 
  onHelpfulToggle,
  onReact,
  isHelpful 
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongReview = review.comment.length > 200;
  const displayText = isExpanded || !isLongReview 
    ? review.comment 
    : `${review.comment.slice(0, 200)}...`;
  
  // Check if review should be dimmed (flagged/removed)
  const isDimmed = review.status === 'flagged' || review.status === 'removed';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDimmed ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative bg-white rounded-2xl p-6 border border-gray-200',
        'hover:shadow-lg hover:border-gray-300 transition-all duration-300',
        'space-y-4',
        isDimmed && 'bg-gray-50'
      )}
    >
      {/* Header: Avatar, Name, Date, Verified Badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-11 w-11 ring-2 ring-gray-100 transition-all group-hover:ring-emerald-100">
            <AvatarImage src={review.user.avatar} alt={review.user.name} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-semibold">
              {review.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-900">
                {review.user.name}
              </h4>
              {review.verifiedStay && <VerifiedStayBadge size="sm" />}
            </div>
            
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(review.date), { addSuffix: true })}
              {review.updatedAt && review.updatedAt !== review.date && (
                <span className="text-xs"> (edited)</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-col items-end gap-1">
          {review.status && review.status !== 'published' && (
            <ReviewStatusBadge 
              status={review.status} 
              flagReason={review.flagReason}
              size="sm"
            />
          )}
          {review.isShortReview && <ShortReviewBadge />}
        </div>
      </div>
      
      {/* Rating */}
      <div className="flex items-center gap-2">
        <RatingStars rating={review.rating} size="sm" />
        <span className="text-sm font-medium text-gray-700">
          {review.rating}.0
        </span>
      </div>
      
      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <ReviewTagChip key={tag} tag={tag} size="sm" />
          ))}
        </div>
      )}
      
      {/* Review Text */}
      <div className="space-y-2">
        <p className="text-[15px] leading-relaxed text-gray-700">
          {displayText}
        </p>
        
        {isLongReview && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Landlord Response */}
      <AnimatePresence>
        {review.landlordResponse && (
          <LandlordResponseCard response={review.landlordResponse} />
        )}
      </AnimatePresence>
      
      {/* Footer: Reactions & Helpful */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100">
        <div className="flex-1">
          {review.reactions && review.reactions.length > 0 && (
            <EmojiReactions 
              reactions={review.reactions} 
              onReact={onReact}
              size="sm"
            />
          )}
        </div>
        
        <HelpfulButton
          count={review.helpfulVotes || 0}
          isHelpful={isHelpful}
          onToggle={onHelpfulToggle}
          size="sm"
        />
      </div>
    </motion.div>
  );
}
