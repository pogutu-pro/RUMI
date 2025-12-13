"use client";

import * as React from 'react';
import { 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  History, 
  Download,
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePayments, usePaymentStats } from '@/features/payments'; // We might need a specific hook for payouts if it exists, otherwise assume mock or generic payments
import { Skeleton } from '@/components/ui/skeleton';

export default function PayoutsPage() {
  // Payouts usually are derived from a 'payouts' endpoint. 
  // If not available, we'll placeholder the list but make the request UI real-ish.
  
  const balance = 450000; // Mock current balance
  const payouts = [
      { id: 'PO-1023', date: '2024-12-01', amount: 150000, status: 'processed', method: 'Bank Transfer' },
      { id: 'PO-1022', date: '2024-11-01', amount: 120000, status: 'processed', method: 'M-Pesa' },
      { id: 'PO-1021', date: '2024-10-01', amount: 180000, status: 'processed', method: 'Bank Transfer' },
  ];

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
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
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
                 {payouts.map((payout, i) => (
                     <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors">
                         <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <ArrowUpRight className="h-5 w-5" />
                             </div>
                             <div>
                                 <p className="font-semibold text-slate-900">Withdrawal to {payout.method}</p>
                                 <p className="text-sm text-slate-500">{payout.date} • ID: {payout.id}</p>
                             </div>
                         </div>
                         <div className="text-right">
                             <p className="font-bold text-slate-900">- KES {payout.amount.toLocaleString()}</p>
                             <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 capitalize">
                                {payout.status}
                             </Badge>
                         </div>
                     </div>
                 ))}
             </div>
         </CardContent>
      </Card>
    </div>
  );
}
