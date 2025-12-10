
import RatingDisplay from './rating-display';

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
}

export default function ReviewSummary({ averageRating, totalReviews }: ReviewSummaryProps) {
  return (
    <div className="flex items-center gap-2">
      <RatingDisplay rating={averageRating} />
      <span>{averageRating.toFixed(1)} ({totalReviews} reviews)</span>
    </div>
  );
}