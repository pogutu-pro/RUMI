import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Shared list/detail page header: title (+ optional description) and the
 * page's actions. On phones they stack, so the title gets the full width and
 * the buttons sit in a row underneath instead of squeezing the text, and the
 * description is kept to two lines.
 * Do not hand-roll icon spacing here: the caller's `action` node should use
 * Button's existing `leftIcon` prop.
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-xl">{title}</h1>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground sm:line-clamp-none">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2 [&>*]:shrink-0">{action}</div>}
    </div>
  );
}
