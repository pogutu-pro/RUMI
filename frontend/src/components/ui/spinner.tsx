import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'ghost';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const variantClasses = {
  primary: 'text-primary',
  secondary: 'text-muted-foreground',
  ghost: 'text-white/80',
};

export function Spinner({ className, size = 'md', variant = 'primary', ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <Loader2
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function PremiumLoadingOverlay({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <Spinner size="xl" className="text-primary"/>
                <p className="text-lg font-medium text-foreground animate-pulse">{message}</p>
            </div>
        </div>
    )
}
