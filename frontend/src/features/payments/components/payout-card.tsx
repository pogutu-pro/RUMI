'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Payout } from '../api'; // Import type from API definition or types file if moved

interface PayoutCardProps {
  payout: Payout;
}

export function PayoutCard({ payout }: PayoutCardProps) {
  // Handle optional or string date
  const dateValue = payout.scheduledDate ? new Date(payout.scheduledDate) : new Date(payout.createdAt);

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
              {payout.currency} {payout.amount.toLocaleString()}
            </span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(dateValue, 'PPP')}</span>
          </div>
          {/* Default to Bank Transfer if method not available, or hide */}
          <p className="text-sm text-muted-foreground">via Bank Transfer</p>
        </div>
      </CardContent>
    </Card>
  );
}
