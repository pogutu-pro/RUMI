'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <Star
            key={star}
            className="cursor-pointer"
            fill={(hover || value) >= star ? 'currentColor' : 'none'}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          />
        );
      })}
    </div>
  );
}
