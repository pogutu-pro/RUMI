'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'mpesa' | 'card' | 'bank';
  name: string;
  details: Record<string, string>;
  isDefault: boolean;
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSelect?: () => void;
}

const methodIcons = {
  mpesa: Smartphone,
  card: CreditCard,
  bank: Building2,
};

export function PaymentMethodCard({ method, onSelect }: PaymentMethodCardProps) {
  const Icon = methodIcons[method.type];

  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{method.name}</CardTitle>
        {method.isDefault && <Badge variant="default">Default</Badge>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium capitalize">{method.type}</p>
            <p className="text-xs text-muted-foreground">
              {method.type === 'mpesa' && method.details.phoneNumber}
              {method.type === 'bank' && method.details.accountNumber}
              {method.type === 'card' && `**** ${method.details.last4}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
