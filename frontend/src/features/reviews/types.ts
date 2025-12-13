// Review Tags (for filtering and display)
export type ReviewTag = 
  | 'cleanliness'
  | 'wifi'
  | 'safety'
  | 'location'
  | 'value'
  | 'landlord'
  | 'quiet'
  | 'facilities'
  | 'maintenance';

// Review Status
export type ReviewStatus = 'published' | 'under_review' | 'flagged' | 'removed';

// Emoji Reactions (TikTok-style)
export interface ReviewReaction {
  emoji: '👍' | '❤️' | '😮' | '😂' | '🔥';
  count: number;
  userReacted?: boolean;
}

// Landlord Response
export interface LandlordResponse {
  id: string;
  landlordName: string;
  landlordAvatar?: string;
  text: string;
  createdAt: string;
}

// Enhanced Review
export interface Review {
  id: string;
  hostelId?: string;
  user: { 
    name: string; 
    avatar: string;
    id?: string;
  };
  rating: number;
  comment: string;
  date: string;
  
  // Modern features
  tags?: ReviewTag[];
  verifiedStay?: boolean;
  helpfulVotes?: number;
  reactions?: ReviewReaction[];
  landlordResponse?: LandlordResponse;
  status?: ReviewStatus;
  isShortReview?: boolean; // Less than 50 characters
  updatedAt?: string;
  
  // For admin
  flagReason?: string;
  flaggedBy?: string;
  flaggedAt?: string;
}

// Review Stats for hostel
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  recommendationRate: number; // percentage
  tagBreakdown: Record<ReviewTag, { count: number; avgRating: number }>;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// Review Filters
export interface ReviewFilters {
  rating?: number; // Filter by star rating
  tags?: ReviewTag[];
  verifiedOnly?: boolean;
  hasPhotos?: boolean;
  sort?: 'newest' | 'helpful' | 'highest' | 'lowest';
}
