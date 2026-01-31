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
        'rounded-none border-2 border-primary bg-white p-6 shadow-sm',
        'sm:p-8',
        'transition-shadow duration-300',
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-8 text-center space-y-3">
          {icon && (
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gray-50 border-2 border-primary rounded-none flex items-center justify-center">
                {icon}
              </div>
            </div>
          )}
          {title && (
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          )}
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          )}
        </header>
      )}

      <div className="space-y-6">{children}</div>

      {footer && <div className="mt-6 border-t pt-4 text-center">{footer}</div>}
    </div>
  );
}

AuthCard.displayName = 'AuthCard';
