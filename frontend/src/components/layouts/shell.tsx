import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'centered' | 'sidebar' | 'mobile';
}

/**
 * Shell layout component that provides consistent container styling and grid layouts.
 * Supports different variants for various page layouts.
 */
export const Shell = React.memo(function Shell({
  children,
  className,
  variant = 'default',
  ...props
}: ShellProps) {
  return (
    <div
      className={cn(
        'grid items-center gap-8 pb-8 pt-6 md:py-8',
        variant === 'default' && 'container max-w-7xl',
        variant === 'centered' && 'container max-w-xl',
        variant === 'sidebar' &&
          'md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] max-w-full container',
        variant === 'mobile' && 'container max-w-full px-0 sm:px-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
