import * as React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceDifferenceIndicatorProps {
  oldPrice: number;
  newPrice: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function PriceDifferenceIndicator({
  oldPrice,
  newPrice,
  currency = 'KES',
  size = 'md',
  showLabels = true,
  className,
}: PriceDifferenceIndicatorProps) {
  const difference = newPrice - oldPrice;
  const percentChange = oldPrice > 0 ? (difference / oldPrice) * 100 : 0;
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;
  const isNeutral = difference === 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Price Comparison */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {showLabels ? 'Current' : 'From'}
          </p>
          <p className={cn('font-semibold text-foreground', sizeClasses[size])}>
            {currency} {oldPrice.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="h-px w-8 bg-border" />
        </div>

        <div className="flex-1 text-right">
          <p className="text-xs text-muted-foreground">
            {showLabels ? 'New' : 'To'}
          </p>
          <p className={cn('font-semibold text-foreground', sizeClasses[size])}>
            {currency} {newPrice.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Difference Badge */}
      <div
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
          isIncrease &&
            'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
          isDecrease &&
            'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
          isNeutral &&
            'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
        )}
      >
        {isIncrease && <TrendingUp className={iconSizes[size]} />}
        {isDecrease && <TrendingDown className={iconSizes[size]} />}
        {isNeutral && <Minus className={iconSizes[size]} />}

        <span>
          {isIncrease && '+'}
          {isDecrease && '-'}
          {currency} {Math.abs(difference).toLocaleString()}
        </span>

        {!isNeutral && (
          <span className="text-xs opacity-75">
            ({Math.abs(percentChange).toFixed(1)}%)
          </span>
        )}
      </div>

      {/* Wallet Impact */}
      {!isNeutral && showLabels && (
        <p className="text-xs text-center text-muted-foreground">
          {isIncrease
            ? '⚠️ Additional payment required'
            : '✅ Refund credited to wallet'}
        </p>
      )}
    </div>
  );
}
