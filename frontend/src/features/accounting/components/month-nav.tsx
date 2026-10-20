'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currentMonthKey, monthLabel, shiftMonth } from '../format';

/** Previous / next month with the current month as the upper limit. */
export function MonthNav({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const atLimit = month >= currentMonthKey();
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border bg-background p-1">
      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium tabular-nums">{monthLabel(month)}</span>
      <Button
        size="icon" variant="ghost" className="h-8 w-8" aria-label="Next month"
        disabled={atLimit} onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
