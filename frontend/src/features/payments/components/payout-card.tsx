'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Payout } from '../types'; 

interface PayoutCardProps {
  payout: Payout;
}

export function PayoutCard({ payout }: PayoutCardProps) {
  // Handle optional or string date
  const dateValue = payout.scheduledDate ? new Date(payout.scheduledDate) : new Date(payout.createdAt);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-black text-foreground">Payout #{payout.id}</CardTitle>
        <Badge 
          className={cn(
            "font-black uppercase text-[10px]",
            payout.status === 'completed' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-muted text-muted-foreground"
          )}
        >
          {payout.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-foreground">
              {payout.currency} {payout.amount.toLocaleString()}
            </span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-black">
              <Calendar className="h-4 w-4" />
              <span>{format(dateValue, 'PPP')}</span>
            </div>
            {/* Default to Bank Transfer if method not available, or hide */}
            <p className="text-[10px] text-muted-foreground/60 uppercase font-black tracking-widest">via Bank Transfer</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
