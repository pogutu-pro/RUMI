'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/ui/price-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  CreditCard, 
  History, 
  Calendar, 
  Home, 
  Wallet, 
  ArrowRight,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useCurrentRentPeriod, useMyWallet, useRentSummary } from '../hooks/use-payments';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

export const RentOverview = () => {
  const router = useRouter();
  const { data: currentPeriod, isLoading: isPeriodLoading } = useCurrentRentPeriod();
  const { data: wallet, isLoading: isWalletLoading } = useMyWallet();
  const { data: summary, isLoading: isSummaryLoading } = useRentSummary();

  const isLoading = isPeriodLoading || isWalletLoading || isSummaryLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48 col-span-2 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  const balance = summary?.total_balance || 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Monthly Rent Panel - High Density, Data-First */}
      <Card className="lg:col-span-2 overflow-hidden border border-border bg-card rounded-lg shadow-none">
        <CardHeader className="py-4 border-b border-border bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <Activity className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Monthly Rent</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-tighter">
                  {currentPeriod ? (
                    `${new Date(currentPeriod.start_date).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })} Cycle`
                  ) : (
                    'No active rent cycle'
                  )}
                </CardDescription>
              </div>
            </div>
            {currentPeriod && (
              <StatusBadge 
                status={currentPeriod.status} 
                className="px-3 py-1 text-[10px] uppercase font-black tracking-widest"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Column 1: Balance Due */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Balance Due</p>
                <PriceDisplay 
                  amount={balance} 
                  size="lg" 
                  className={cn(
                    "font-black",
                    balance > 0 ? "text-red-600" : "text-emerald-600"
                  )}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Monthly Target</p>
                <PriceDisplay amount={currentPeriod?.amount_due || 0} size="sm" className="font-bold opacity-60" />
              </div>
            </div>

            {/* Column 2: Amount Paid/Status */}
            <div className="p-6 space-y-4 bg-muted/5">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Amount Paid</p>
                <PriceDisplay 
                  amount={currentPeriod?.amount_paid || 0} 
                  size="lg" 
                  className="font-black text-foreground"
                />
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500" title="System Verified" />
                 <span className="text-[9px] font-black uppercase text-muted-foreground">Ledger Records Match</span>
              </div>
            </div>

            {/* Column 3: Actions & Details */}
            <div className="p-6 flex flex-col justify-center gap-3">
              <Button 
                className="w-full bg-primary text-primary-foreground font-black uppercase tracking-tight rounded-lg"
                onClick={() => router.push('/student/payments/new')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
              <div className="grid grid-cols-2 gap-2">
                 <div className="p-2 rounded-lg bg-muted/20 border border-border text-center">
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Due Date</p>
                    <p className="text-[10px] font-black">{currentPeriod ? new Date(currentPeriod.end_date).toLocaleDateString() : 'N/A'}</p>
                 </div>
                 <div className="p-2 rounded-lg bg-muted/20 border border-border text-center">
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Room ID</p>
                    <p className="text-[10px] font-black">{currentPeriod?.room_details?.room_number || 'N/A'}</p>
                 </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Panel - High Density */}
      <Card className="border border-primary/20 bg-primary/5 shadow-none rounded-lg flex flex-col">
        <CardHeader className="py-4 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">My Wallet</CardTitle>
              <CardDescription className="text-xs font-bold text-primary/60">Credits & Overpayments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
             <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-80">Available Funds</p>
             <PriceDisplay 
               amount={wallet?.balance || 0} 
               size="xl" 
               className="font-black text-primary"
             />
          </div>
          
          <div className="space-y-4 pt-6">
            <div className="flex gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                <p className="text-[10px] font-bold text-primary leading-tight">Wallet credits are automatically applied to the next rent cycle.</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-between font-black text-xs uppercase tracking-tight border-primary/30 text-primary hover:bg-primary/10 rounded-lg"
              onClick={() => router.push('/student/payments/wallet')}
            >
              <span>View History</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
