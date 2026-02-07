'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader,CardTitle } from '@/components/ui/card';
import { UnmatchedPaymentsDashboard } from '@/features/payments/components/unmatched-payments-dashboard';
import { PaymentLedgerViewer } from '@/features/payments/components/payment-ledger-viewer';

export default function AdminPaymentsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Payment Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reconciliation, ledger management, and analytics
          </p>
        </div>
      </div>

      {/* Unmatched Payments */}
      <UnmatchedPaymentsDashboard />

      {/* Payment Ledger */}
      <PaymentLedgerViewer />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 2,847,500</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.7%</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reconciliation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">12</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
