import { Star } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  size?: number;
}

export default function RatingDisplay({
  rating,
  size = 16,
}: RatingDisplayProps) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="text-yellow-400"
          fill={i < rating ? 'currentColor' : 'none'}
          size={size}
        />
      ))}
    </div>
  );
}
