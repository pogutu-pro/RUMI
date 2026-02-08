'use client';

import * as React from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentHistoryTable } from '@/features/payments/components/payment-history-table';
import { DollarSign, TrendingUp, Users } from 'lucide-react';
import apiClient from '@/lib/api/client';

export default function CaretakerPaymentsPage() {
  const { user } = useAuth();

  const { data: hostelData } = useQuery({
    queryKey: ['caretaker-hostel', user?.id],
    queryFn: async () => {
      const response = await apiClient.axios.get('/caretaker/hostel/');
      return response.data.data;
    },
    enabled: !!user,
  });

  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary', hostelData?.id],
    queryFn: async () => {
      const response = await apiClient.axios.get(`/payments/summary/${hostelData?.id}/`);
      return response.data.data;
    },
    enabled: !!hostelData?.id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Payments Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View payment activity and transaction history (read-only)
          </p>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(paymentSummary?.total_this_month || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentSummary?.transactions_count || 0} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {paymentSummary?.pending_count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paymentSummary?.payment_rate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students paid on time</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistoryTable />
        </CardContent>
      </Card>
    </div>
  );
}
