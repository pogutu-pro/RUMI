'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface OAuthDividerProps {
  text?: string;
  className?: string;
}

export function OAuthDivider({ text = 'OR', className }: OAuthDividerProps) {
  return (
    <div className={cn('relative my-4', className)}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-4 bg-white text-gray-500">
          {text}
        </span>
      </div>
    </div>
  );
}

OAuthDivider.displayName = 'OAuthDivider';
