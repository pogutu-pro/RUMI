import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface RumiaLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the mark in px; height follows the logo's proportions. */
  size?: number;
  /** Visible caption under the mark. Pass null for the mark alone. */
  text?: string | null;
  /** Accessible name announced to screen readers. */
  label?: string;
}

/**
 * The RumiaRent logo, redrawn as SVG so it can build itself: the roof and the
 * "R" draw in, the leg grows, then the four windows switch on, and the loop
 * fades and repeats. Pure CSS (see `.rumia-loader` in globals.css) so it runs
 * with no JavaScript and stays smooth while the app is still hydrating.
 * Honors `prefers-reduced-motion` by showing the static mark.
 */
export function RumiaLoader({
  size = 96,
  text = null,
  label = 'Loading',
  className,
  ...props
}: RumiaLoaderProps) {
  const windows = [
    { x: 132, y: 162 },
    { x: 157, y: 162 },
    { x: 132, y: 187 },
    { x: 157, y: 187 },
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('rumia-loader flex flex-col items-center justify-center gap-5', className)}
      {...props}
    >
      <svg
        viewBox="0 0 301 332"
        width={size}
        height={(size * 332) / 301}
        fill="none"
        aria-hidden="true"
        className="rumia-loader__mark"
      >
        <g className="rumia-loader__all">
          <path
            className="rumia-loader__roof"
            pathLength={1}
            d="M28 106 L148 35 Q155 31 162 35 L268 100"
            stroke="hsl(var(--primary))"
            strokeWidth={38}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="rumia-loader__r"
            pathLength={1}
            d="M77 322 L77 172 L146 130 C214 112 248 148 248 186 C248 222 222 240 178 240 L150 240"
            stroke="hsl(var(--primary))"
            strokeWidth={46}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
          <path
            className="rumia-loader__leg"
            d="M138 234 L180 230 L274 318 L268 324 L206 324 L136 246 Z"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--primary))"
            strokeWidth={8}
            strokeLinejoin="round"
          />
          {windows.map((w, i) => (
            <rect
              key={i}
              className={`rumia-loader__win rumia-loader__win--${i + 1}`}
              x={w.x}
              y={w.y}
              width={20}
              height={20}
              rx={3}
              fill="hsl(var(--foreground))"
            />
          ))}
        </g>
      </svg>
      {text && (
        <p className="text-center text-sm font-medium tracking-wide text-muted-foreground">{text}</p>
      )}
    </div>
  );
}
