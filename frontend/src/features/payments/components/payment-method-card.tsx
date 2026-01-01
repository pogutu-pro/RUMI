'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';

import { PaymentMethod } from '../types';

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
      className="cursor-pointer hover:border-emerald-500/50 transition-all active:scale-[0.98] border-border bg-card shadow-sm"
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-black text-foreground">{method.name}</CardTitle>
        {method.isDefault && <Badge className="bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[10px]">Default</Badge>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground capitalize">{method.type}</p>
            <p className="text-xs text-muted-foreground font-black">
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
