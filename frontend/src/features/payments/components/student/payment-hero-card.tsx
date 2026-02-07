'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/ui/price-display';
import { useCurrentRentPeriod, useRentSummary } from '../../hooks/use-payments';
import { PaymentDrawer } from './payment-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function PaymentHeroCard() {
  const { data: currentPeriod, isLoading: isPeriodLoading } = useCurrentRentPeriod();
  const { data: summary, isLoading: isSummaryLoading } = useRentSummary();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const isLoading = isPeriodLoading || isSummaryLoading;

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const balance = summary?.total_balance || 0;
  const isOverdue = currentPeriod?.status === 'overdue';
  const isPaid = balance <= 0;

  return (
    <>
      <Card className={cn(
        "overflow-hidden border-0 shadow-lg relative",
        isPaid ? "bg-emerald-600 text-white" : "bg-white text-zinc-900"
      )}>
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-current opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            
            {/* Left: Balance Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 opacity-80">
                {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {isPaid ? "All Caught Up" : "Total Balance Due"}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className={cn("text-5xl md:text-6xl font-black tracking-tighter", isPaid ? "text-white" : "text-zinc-900")}>
                  {balance.toLocaleString()}
                </span>
                <span className="text-sm font-bold opacity-60">KES</span>
              </div>

              {currentPeriod && !isPaid && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 text-xs font-semibold">
                  <span className={cn(isOverdue ? "text-red-600" : "text-zinc-600")}>
                    Due {new Date(currentPeriod.end_date).toLocaleDateString()}
                  </span>
                  {isOverdue && (
                     <span className="flex items-center gap-1 text-red-600 font-bold uppercase text-[10px] tracking-wider">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                     </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-3 justify-center md:items-end">
              {!isPaid ? (
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-lg font-bold shadow-xl bg-black hover:bg-zinc-800 text-white rounded-full transition-transform active:scale-95"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  Pay Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <Button 
                   variant="outline"
                   className="h-14 px-8 border-white/20 hover:bg-white/10 text-white rounded-full bg-transparent"
                >
                   View Receipt History
                </Button>
              )}
              
              {!isPaid && (
                  <p className="text-xs text-muted-foreground md:text-right max-w-xs">
                     Secure M-Pesa payment. Instant confirmation.
                  </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        bookingId={currentPeriod?.id || 'current'}
        amount={balance}
        hostelName={currentPeriod?.hostel_details?.name}
        description={`Rent Payment - ${currentPeriod ? new Date(currentPeriod.start_date).toLocaleDateString('en-KE', { month: 'long' }) : 'Total Balance'}`}
      />
    </>
  );
}
