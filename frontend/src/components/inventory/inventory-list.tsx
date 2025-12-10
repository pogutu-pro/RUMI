import type { InventoryItem } from '@/lib/api/inventory';
import { InventoryItemCard } from './inventory-item-card';

interface InventoryListProps {
  items: InventoryItem[];
}

export function InventoryList({ items }: InventoryListProps) {
  if (!items.length) {
    return (
      <div className="py-8 text-sm text-slate-500 text-center">
        No inventory items found.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <InventoryItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
