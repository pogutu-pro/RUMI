'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
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
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <p className="text-sm font-medium capitalize">{transaction.type}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
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
              : 'secondary'
          }
        >
          {transaction.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{transaction.description}</p>
          <div className="flex items-center gap-1">
            <span
              className={`text-lg font-semibold ${
                isPositive ? 'text-green-600' : 'text-foreground'
              }`}
            >
              {isPositive ? '+' : ''}KES {transaction.amount.toLocaleString()}
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
