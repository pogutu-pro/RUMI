import { RumiaLoader } from '@/components/ui/rumia-loader';
import { cn } from '@/lib/utils/cn';

interface BrandedLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  text?: string;
}

/** Centered animated-logo loader for full sections and route transitions. */
export function BrandedLoader({
  className,
  size = 120,
  text = 'Preparing your RumiaRent experience',
  ...props
}: BrandedLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)} {...props}>
      <RumiaLoader size={size} text={text} />
    </div>
  );
}
