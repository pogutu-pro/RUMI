import { Badge } from '@/components/ui/badge';
import { STATUS_LABEL } from '../lib/format';

const VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  waived: 'outline',
  due: 'secondary',
  upcoming: 'outline',
  partially_paid: 'secondary',
  overdue: 'destructive',
  disputed: 'destructive',
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT[status] ?? 'secondary'}>{STATUS_LABEL[status] ?? status}</Badge>;
}
