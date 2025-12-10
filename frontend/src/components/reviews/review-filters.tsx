'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReviewFiltersProps {
  onSortChange: (sort: 'newest' | 'highest' | 'lowest') => void;
}

export default function ReviewFilters({ onSortChange }: ReviewFiltersProps) {
  return (
    <Select onValueChange={onSortChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest first</SelectItem>
        <SelectItem value="highest">Highest rating</SelectItem>
        <SelectItem value="lowest">Lowest rating</SelectItem>
      </SelectContent>
    </Select>
  );
}
