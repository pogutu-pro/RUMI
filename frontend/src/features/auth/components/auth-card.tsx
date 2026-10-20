'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface AuthCardProps {
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function AuthCard({
  title,
  description,
  footer,
  children,
  className,
  icon,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-white p-6 shadow-sm',
        'sm:p-8',
        'transition-shadow duration-300',
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-8 text-center space-y-3">
          {icon && (
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
            </div>
          )}
          {title && (
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          )}
          {description && (
            <div className="text-sm text-gray-600 leading-relaxed">
              {description}
            </div>
          )}
        </header>
      )}

      <div className="space-y-6">{children}</div>

      {footer && <div className="mt-6 border-t pt-4 text-center">{footer}</div>}
    </div>
  );
}

AuthCard.displayName = 'AuthCard';
