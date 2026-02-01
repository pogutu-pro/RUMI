'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  date: Date;
  description: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const isPositive = transaction.type !== 'payment';

  return (
    <Card
      className="cursor-pointer hover:border-emerald-500/50 transition-all active:scale-[0.98] border-border bg-card shadow-sm"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <p className="text-sm font-black text-foreground capitalize">{transaction.type}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 font-black">
            <Calendar className="h-3 w-3" />
            {format(transaction.date, 'PPp')}
          </p>
        </div>
        <Badge
          variant={
            transaction.status === 'completed'
              ? 'default'
              : transaction.status === 'failed'
              ? 'destructive'
              : transaction.status === 'processing'
              ? 'outline'
              : 'secondary'
          }
          className={cn(
            "font-black uppercase text-[10px]",
            transaction.status === 'completed' && "bg-emerald-500 hover:bg-emerald-600",
            transaction.status === 'processing' && "border-amber-500 text-amber-500",
          )}
        >
          {transaction.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-black">{transaction.description}</p>
          <div className="flex items-center gap-1">
            <span
              className={`text-xl font-black ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
              }`}
            >
              {isPositive ? '+' : ''}KES {transaction.amount.toLocaleString()}
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/30" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
