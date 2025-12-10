'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  ariaLabel?: string;
}

/**
 * Breadcrumbs navigation component.
 * Displays a list of breadcrumb items with optional links.
 */
export const Breadcrumbs = React.memo(function Breadcrumbs({
  items,
  ariaLabel = 'Breadcrumb',
  className,
  ...props
}: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      <ol role="list" className="flex space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              {!isLast && item.href ? (
                <Link
                  href={item.href as any}
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
