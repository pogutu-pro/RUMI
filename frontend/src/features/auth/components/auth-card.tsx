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

/**
 * Heading and body for a screen inside AuthShell. Deliberately unboxed: the
 * shell already frames the form, and a card inside it reads as clutter.
 */
export function AuthCard({ title, description, footer, children, className, icon }: AuthCardProps) {
  return (
    <div className={cn('w-full', className)}>
      {(title || description) && (
        <header className="mb-8 space-y-2">
          {icon && (
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          {title && <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">{title}</h1>}
          {description && <div className="text-[15px] leading-relaxed text-gray-500">{description}</div>}
        </header>
      )}

      <div className="space-y-6">{children}</div>

      {footer && <div className="mt-8 border-t border-gray-100 pt-6 text-center">{footer}</div>}
    </div>
  );
}

AuthCard.displayName = 'AuthCard';
