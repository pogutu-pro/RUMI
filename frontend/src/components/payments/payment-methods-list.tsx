'use client';

import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { PaymentMethodCard } from './payment-method-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PaymentMethodsListProps {
  onSelect?: (methodId: string) => void;
  onAddNew?: () => void;
}

export function PaymentMethodsList({ onSelect, onAddNew }: PaymentMethodsListProps) {
  const { data: methods, isLoading } = usePaymentMethods();

  if (isLoading) {
    return <div>Loading payment methods...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        <Button size="sm" onClick={onAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {methods?.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            onSelect={() => onSelect?.(method.id)}
          />
        ))}
      </div>

      {methods?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No payment methods added yet
        </div>
      )}
    </div>
  );
}
