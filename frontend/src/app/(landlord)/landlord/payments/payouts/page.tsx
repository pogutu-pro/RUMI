'use client';

import * as React from 'react';
import { 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  History, 
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLandlordPayouts, usePaymentStats } from '@/features/payments';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
};

export default function PayoutsPage() {
  const { 
    data: payoutsResponse, 
    isLoading: isLoadingPayouts,
    isError: isPayoutsError 
  } = useLandlordPayouts();

  const { 
    data: stats, 
    isLoading: isLoadingStats,
    isError: isStatsError 
  } = usePaymentStats();

  const handleRequestPayout = () => {
    toast.info("Payout request feature coming soon");
  };

  const balance = stats?.availableBalance || 0;
  // Use .data for PaginatedResponse as defined in shared types
  const payouts = payoutsResponse?.data || [];
  
  const isLoading = isLoadingPayouts || isLoadingStats;
  const isError = isPayoutsError || isStatsError;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load payouts data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Payouts
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View earnings and request withdrawals
          </p>
        </div>
        <Button 
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleRequestPayout}
        >
            <ArrowUpRight className="h-4 w-4" />
            Request Payout
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         {/* Balance Card */}
         <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold mb-4">KES {balance.toLocaleString()}</div>
                <div className="flex gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Available for withdrawal</span>
                    </div>
                </div>
            </CardContent>
         </Card>

         {/* Account Info */}
         <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wider">Default Payout Method</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Equity Bank</p>
                        <p className="text-sm text-slate-500">**** 8392</p>
                    </div>
                </div>
                <Button variant="outline" size="sm">Manage Methods</Button>
            </CardContent>
         </Card>
      </div>

      {/* History */}
      <Card className="border-none shadow-md">
         <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payout History
             </CardTitle>
         </CardHeader>
         <CardContent>
             <div className="space-y-4">
                 {payouts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No payout history found</div>
                 ) : (
                    payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                 <ArrowUpRight className="h-5 w-5" />
                              </div>
                              <div>
                                  <p className="font-semibold text-slate-900">Withdrawal to {payout.recipient || 'Bank'}</p>
                                  <p className="text-sm text-slate-500">
                                    {new Date(payout.createdAt).toLocaleDateString()} • ID: {payout.id.slice(0, 8)}
                                  </p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-slate-900">- {formatCurrency(payout.amount)}</p>
                              <Badge variant="outline" className={`capitalize ${
                                payout.status === 'completed' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                                payout.status === 'pending' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                                'text-slate-600 border-slate-200 bg-slate-50'
                              }`}>
                                 {payout.status}
                              </Badge>
                          </div>
                      </div>
                  ))
                 )}
             </div>
         </CardContent>
      </Card>
    </div>
  );
}
