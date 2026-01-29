'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type { Transaction } from '@/types/entities.types';

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
  className?: string;
}

export function TransactionList({ transactions, limit = 5, className }: TransactionListProps) {
  const displayTransactions = transactions.slice(0, limit);

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'rent':
        return 'Rent';
      case 'deposit':
        return 'Deposit';
      case 'penalty':
        return 'Late Fee';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {displayTransactions.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground text-center">
            No transactions yet
          </p>
        ) : (
          <div className="divide-y dark:divide-gray-800">
            {displayTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">
                      KES {transaction.amount.toLocaleString()}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{getTypeLabel(transaction.type)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {transaction.method && <> • {transaction.method}</>}
                  </p>
                  {transaction.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{transaction.description}</p>
                  )}
                </div>
                <Badge variant="outline" className={cn('text-[10px] font-medium ml-3', getStatusColor(transaction.status))}>
                  {transaction.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
