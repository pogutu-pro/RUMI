'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {  DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { PaymentOptionsModal } from '@/features/payments/components/payment-options-modal';
import { PaymentStatusTracker } from '@/features/payments/components/payment-status-tracker';
import { PaymentHistoryTable } from '@/features/payments/components/payment-history-table';
import { getCurrentRentPeriod } from '@/features/payments/api/payments';

export default function StudentPaymentsPage() {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTransactionRef, setActiveTransactionRef] = useState<string | null>(null);

  // Fetch current rent period for balance
  const { data: currentPeriod, isLoading: periodLoading } = useQuery({
    queryKey: ['current-rent-period'],
    queryFn: getCurrentRentPeriod,
    enabled: !!user,
  });

  const balance = currentPeriod?.balance || 0;
  const amountDue = currentPeriod?.amount_due || 0;
  const periodLabel = currentPeriod
    ? `${new Date(currentPeriod.start_date).toLocaleDateString()} - ${new Date(currentPeriod.end_date).toLocaleDateString()}`
    : 'Current period';

  const handlePaymentInitiated = (transactionRef: string) => {
    setActiveTransactionRef(transactionRef);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your rent payments and view transaction history
          </p>
        </div>
      </div>

      {/* Current Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {periodLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <div className="text-4xl font-bold">
                  KES {balance.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Due for {periodLabel}
                </p>
              </div>

              {balance > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                      Payment Required
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      You have an outstanding balance of KES {balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setShowPaymentModal(true)}
                disabled={!currentPeriod || balance <= 0}
              >
                Make Payment
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Payment Tracker */}
      {activeTransactionRef && (
        <Card>
          <CardHeader>
            <CardTitle>Payment in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentStatusTracker transactionRef={activeTransactionRef} />
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistoryTable userId={user?.id} />
        </CardContent>
      </Card>

      {/* Payment Options Modal */}
      {currentPeriod && (
        <PaymentOptionsModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bedId={currentPeriod.bed_slot_id}
          amount={balance}
          bookingId={currentPeriod.booking}
          onPaymentInitiated={handlePaymentInitiated}
        />
      )}
    </div>
  );
}
