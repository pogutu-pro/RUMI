'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface PayoutCardProps {
  payout: {
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed';
    scheduledDate: Date;
    method: string;
  };
}

export function PayoutCard({ payout }: PayoutCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Payout #{payout.id}</CardTitle>
        <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>
          {payout.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              KES {payout.amount.toLocaleString()}
            </span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(payout.scheduledDate, 'PPP')}</span>
          </div>
          <p className="text-sm text-muted-foreground">via {payout.method}</p>
        </div>
      </CardContent>
    </Card>
  );
}
