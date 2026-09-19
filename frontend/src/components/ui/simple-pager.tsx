'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimplePagerProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Range and Previous / Next: "11-20 of 47", "Page 2 of 5". Always shown when there is
 * data, even for a single page (with both buttons disabled), so people can see
 * the list is paged and how many rows there are; hidden only for an empty list.
 */
export function SimplePager({ page, pageSize, total, onPageChange, className }: SimplePagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= 0) return null;

  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  const button =
    'flex h-8 w-8 items-center justify-center rounded-lg border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className={className ?? 'flex items-center justify-between gap-3 px-1'}>
      <p className="text-xs text-muted-foreground">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <span className="mr-2 text-xs text-muted-foreground">
          Page {current} of {pageCount}
        </span>
        <button type="button" aria-label="Previous page" className={button} disabled={current === 1} onClick={() => onPageChange(current - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Next page" className={button} disabled={current === pageCount} onClick={() => onPageChange(current + 1)}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
