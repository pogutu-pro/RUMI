'use client';

import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface SimpleHostelSearchProps {
  className?: string;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

/**
 * SimpleHostelSearch - Smart search bar for hostel names
 * Features: Debounced real-time search, loading state, clearable, specialized UX
 */
export function SimpleHostelSearch({ className, onSearch, isLoading = false }: SimpleHostelSearchProps) {
  const [query, setQuery] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce the search callback by 300ms to avoid excessive API calls
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearch?.(value);
  }, 400);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate search on enter, bypassing debounce
    debouncedSearch.cancel(); 
    onSearch?.(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative w-full max-w-lg mx-auto',
        className
      )}
    >
      <div
        className={cn(
          'relative flex items-center bg-gray-50 rounded-xl border transition-all duration-200 h-10 overflow-hidden',
          isFocused
            ? 'bg-white border-gray-900 ring-1 ring-gray-900 shadow-md'
            : 'border-transparent hover:border-gray-300 hover:bg-white',
          query && !isFocused && 'bg-white border-gray-200'
        )}
      >
        {/* Search Icon / Loader */}
        <div className="pl-3 pr-2 text-gray-400">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-900" />
          ) : (
            <Search className={cn("h-4 w-4 transition-colors", isFocused ? "text-gray-900" : "text-gray-400")} />
          )}
        </div>

        {/* Input */}
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search hostels, universities..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0',
            'placeholder:text-gray-400 text-sm font-medium text-gray-900 h-full'
          )}
        />

        {/* Clear Button */}
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="mr-1 h-7 w-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    </form>
  );
}
