'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface SimpleHostelSearchProps {
  className?: string;
  onSearch?: (query: string) => void;
}

/**
 * SimpleHostelSearch - Minimalist search bar for hostel names
 * Mobile-first, clean design focused on hostel discovery
 */
export function SimpleHostelSearch({ className, onSearch }: SimpleHostelSearchProps) {
  const [query, setQuery] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative w-full transition-all duration-200',
        className
      )}
    >
      <div
        className={cn(
          'relative flex items-center bg-white rounded-full border transition-all duration-200',
          isFocused
            ? 'border-gray-300 shadow-md ring-2 ring-gray-200/50'
            : 'border-gray-200 shadow-sm hover:shadow-md'
        )}
      >
        {/* Search Icon */}
        <div className="pl-4 pr-3 text-gray-400">
          <Search className="h-4 w-4" />
        </div>

        {/* Input */}
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by hostel name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
            'placeholder:text-gray-400 text-sm font-medium'
          )}
        />

        {/* Clear Button */}
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="mr-1 h-7 w-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}

        {/* Search Button (Mobile) */}
        <Button
          type="submit"
          size="sm"
          className="mr-1.5 h-8 px-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm hover:shadow transition-all text-xs font-semibold"
        >
          Search
        </Button>
      </div>

      {/* Recent Searches (Optional future enhancement) */}
      {isFocused && query.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hidden md:block">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Popular Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {['UoN Hostels', 'Kenyatta University', 'Affordable', 'Female Only'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  onSearch?.(term);
                }}
                className="px-3 py-1.5 text-sm rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
