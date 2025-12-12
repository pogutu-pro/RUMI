'use client';

import { usePayments } from '@/hooks/use-payments';
import { TransactionCard } from './transaction-card';
import { useState } from 'react';
import { TransactionDetails } from './transaction-details';

export function TransactionList() {
  const { data: payments, isLoading } = usePayments();
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  const transactions = payments?.map((payment) => ({
    id: payment.id,
    type: 'payment' as const,
    amount: payment.amount,
    status: payment.status as 'completed' | 'pending' | 'failed',
    date: new Date(payment.date),
    description: payment.reference,
  }));

  return (
    <div className="space-y-4">
      {transactions?.map((transaction) => (
        <TransactionCard
          key={transaction.id}
          transaction={transaction}
          onClick={() => setSelectedTransaction(transaction.id)}
        />
      ))}

      {transactions?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No transactions found
        </div>
      )}

      {selectedTransaction && (
        <TransactionDetails
          transactionId={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
