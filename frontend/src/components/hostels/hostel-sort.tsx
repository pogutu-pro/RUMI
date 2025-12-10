'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFiltersStore } from '@/stores/filters.store';

const sortOptions = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'distance', label: 'Closest to campus' },
];

export default function HostelSort() {
  const { sort, setSort } = useFiltersStore();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 border-2 border-gray-400 hover:border-emerald-500 bg-white shadow-md hover:shadow-lg transition-all font-medium">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Sort by
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <RadioGroup
          value={sort}
          onValueChange={(v) => {
            setSort(v);
            setOpen(false);
          }}
        >
          {sortOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 py-2"
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
}
