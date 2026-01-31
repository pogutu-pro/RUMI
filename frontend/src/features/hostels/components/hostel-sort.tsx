'use client';

import * as React from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFiltersStore } from '@/features/hostels';
import { cn } from '@/lib/utils';

export default function HostelSort() {
  const { sort, setSort } = useFiltersStore();

  const sortOptions = [
    { value: 'popularity', label: 'Most Popular' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'distance', label: 'Nearest to Campus' },
  ];

  const currentLabel = sortOptions.find(opt => opt.value === sort)?.label || 'Sort by';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 gap-2 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900 transition-all font-medium rounded-md shadow-sm min-w-[140px] justify-between"
        >
          <span className="truncate">{currentLabel}</span>
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] p-1">
        <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1.5">
          Sort by
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-100 my-1" />
        <DropdownMenuGroup>
          {sortOptions.map((option) => {
            const isSelected = sort === option.value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSort(option.value as any)}
                className={cn(
                  "flex items-center justify-between cursor-pointer px-2.5 py-2 rounded-sm text-sm font-medium transition-colors my-0.5",
                  isSelected ? "bg-gray-50 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {option.label}
                {isSelected && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
