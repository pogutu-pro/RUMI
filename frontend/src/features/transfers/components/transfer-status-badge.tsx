import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TRANSFER_STATUS_LABELS, TRANSFER_STATUS_COLORS } from '@/lib/constants/transfer-statuses';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Check 
} from 'lucide-react';

interface TransferStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const getStatusIcon = (status: string) => {
  const iconClass = 'h-3 w-3';
  switch (status) {
    case 'pending':
      return <Clock className={iconClass} />;
    case 'approved':
      return <CheckCircle2 className={iconClass} />;
    case 'rejected':
      return <XCircle className={iconClass} />;
    case 'cancelled':
      return <Ban className={iconClass} />;
    case 'completed':
      return <Check className={iconClass} />;
    default:
      return null;
  }
};

export function TransferStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: TransferStatusBadgeProps) {
  const colors = TRANSFER_STATUS_COLORS[status] || TRANSFER_STATUS_COLORS.pending;
  const label = TRANSFER_STATUS_LABELS[status] || status;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && getStatusIcon(status)}
      <span>{label}</span>
    </Badge>
  );
}
