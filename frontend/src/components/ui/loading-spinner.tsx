import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
  color?: string;
  text?: string;
  animationSpeed?: string;
  'aria-label'?: string;
}

/**
 * A standalone, animated spinner component for buttons or overlays.
 * Supports custom size, color, animation speed, and accessible labeling.
 */
export const LoadingSpinner = React.memo(
  React.forwardRef<HTMLSpanElement, LoadingSpinnerProps>(
    (
      {
        size = 24,
        color = 'currentColor',
        text,
        animationSpeed = '1s',
        className,
        'aria-label': ariaLabel = 'Loading',
        ...props
      },
      ref,
    ) => {
      return (
        <span
          ref={ref}
          role="status"
          aria-live="polite"
          aria-label={ariaLabel}
          className={cn(
            'flex items-center justify-center space-x-2 text-primary',
            className,
          )}
          {...props}
        >
          <Loader2
            size={size}
            color={color}
            style={{ animationDuration: animationSpeed }}
            className="animate-spin"
          />
          {text && <span className="text-sm font-medium">{text}</span>}
        </span>
      );
    },
  ),
);

LoadingSpinner.displayName = 'LoadingSpinner';
