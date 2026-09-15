import { cn } from '@/lib/utils/cn';

/**
 * "RumiaRent" wordmark — "Rumia" in the brand green (text-primary), "Rent"
 * in the foreground color, matching the logo artwork. `text-foreground`
 * (not a hardcoded black) so it still reads correctly in dark mode.
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
        'inline-flex items-baseline font-black tracking-tight',
        sizeClasses[size],
        className,
      )}
      role="img"
      aria-label="RumiaRent"
    >
      <span className="text-primary">Rumia</span>
      <span className="text-foreground">Rent</span>
    </div>
  );
}

// Compact version for header use
export function RumiaLogoCompact({ className }: { className?: string }) {
  return <RumiaAnimatedLogo size="sm" className={className} />;
}
