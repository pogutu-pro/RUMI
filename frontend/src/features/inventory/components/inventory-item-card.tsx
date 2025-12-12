import type { InventoryItem } from '@/features/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InventoryItemCardProps {
  item: InventoryItem;
}

const conditionVariant = (condition: InventoryItem['condition']) => {
  switch (condition) {
    case 'good':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'worn':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'damaged':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'missing':
      return 'border-slate-300 bg-slate-50 text-slate-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-900">
            {item.name}
          </CardTitle>
          {item.category && (
            <p className="text-xs text-slate-500 mt-0.5">{item.category}</p>
          )}
        </div>
        <Badge
          variant="outline"
          className={`text-[11px] ${conditionVariant(item.condition)}`}
        >
          {item.condition}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-slate-600 space-y-1">
        <p>
          <span className="font-medium text-slate-800">
            Quantity:
          </span>{' '}
          {item.quantity} {item.unit ?? ''}
        </p>
        <p>
          <span className="font-medium text-slate-800">Location:</span>{' '}
          {item.location}
        </p>
        {item.lastCheckedAt && (
          <p className="text-[11px] text-slate-500">
            Last checked on {new Date(item.lastCheckedAt).toLocaleDateString()}
          </p>
        )}
        {item.notes && (
          <p className="text-[11px] text-slate-500 truncate">{item.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
