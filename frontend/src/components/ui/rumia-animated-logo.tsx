import { cn } from '@/lib/utils/cn';

/**
 * "RumiaRent" wordmark. Static, single brand color (text-primary).
 */

interface RumiaAnimatedLogoProps {
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

export function RumiaAnimatedLogo({
  className,
  size = 'md',
}: RumiaAnimatedLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-6xl',
  };

  return (
    <div
      className={cn(
        'inline-flex items-baseline font-black tracking-tight text-primary',
        sizeClasses[size],
        className,
      )}
      role="img"
      aria-label="RumiaRent"
    >
      RumiaRent
    </div>
  );
}

// Compact version for header use
export function RumiaLogoCompact({ className }: { className?: string }) {
  return <RumiaAnimatedLogo size="sm" className={className} />;
}
