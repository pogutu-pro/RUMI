'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { 
  ArrowLeft, 
  Wallet, 
  ArrowRightLeft, 
  ArrowUpRight, 
  ArrowDownLeft,
  Info,
  History
} from 'lucide-react';
import { useMyWallet, useTransferHistory } from '@/features/payments/hooks/use-payments';
import { PriceDisplay } from '@/components/ui/price-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StudentWalletPage() {
  const router = useRouter();
  const { data: wallet, isLoading: isWalletLoading } = useMyWallet();
  const { data: transfers, isLoading: isTransfersLoading } = useTransferHistory();

  const isLoading = isWalletLoading || isTransfersLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      <div className="flex items-center gap-4 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Wallet</h1>
          <p className="text-sm text-muted-foreground">Manage your credits and overpayments</p>
        </div>
      </div>

      {/* Main Balance Card */}
      <Card className="overflow-hidden border-none bg-primary shadow-2xl shadow-primary/20 text-primary-foreground relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet className="h-32 w-32" />
        </div>
        <CardContent className="p-8 sm:p-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Available Credit Balance</p>
              {isLoading ? (
                <Skeleton className="h-12 w-48 bg-white/20" />
              ) : (
                <PriceDisplay 
                  amount={wallet?.balance || 0} 
                  size="xl" 
                  className="text-5xl font-black tracking-tighter" 
                />
              )}
            </div>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-bold rounded-2xl h-14 px-8 shadow-xl"
              onClick={() => router.push('/student/payments/pay')}
            >
              Apply to Rent
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Transfer History */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
               <History className="h-5 w-5 text-muted-foreground" />
               Credit History
            </h2>
            <p className="text-xs font-medium text-muted-foreground">Showing latest transfers</p>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : !transfers || transfers.length === 0 ? (
              <Card className="border-dashed bg-muted/20 py-12 text-center">
                 <p className="text-muted-foreground font-medium">No transfer history found.</p>
              </Card>
            ) : (
              transfers.map((log) => (
                <Card key={log.id} className="border-none shadow-sm ring-1 ring-border transition-all hover:ring-primary/20 bg-card overflow-hidden">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center",
                            log.reason.includes('payment') ? "bg-emerald-500/10 text-emerald-600" :
                            log.reason.includes('transfer') ? "bg-blue-500/10 text-blue-600" :
                            "bg-muted text-muted-foreground"
                          )}>
                             {log.reason.includes('transfer') ? <ArrowRightLeft className="h-5 w-5" /> :
                              <ArrowDownLeft className="h-5 w-5" />}
                          </div>
                          <div>
                             <p className="text-sm font-bold capitalize">{log.reason.replace(/_/g, ' ')}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(log.created_at).toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <PriceDisplay amount={log.amount} size="md" className="font-black text-foreground" />
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">Captured</p>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Info */}
        <div className="md:col-span-4 space-y-6">
           <Card className="border-none shadow-sm ring-1 ring-border bg-card">
              <CardHeader className="pb-3 px-6">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Wallet Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Automatic Application</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Credits are automatically deducted from your outstanding rent balance when you make a payment.</p>
                  </div>
                  <div className="space-y-1 border-t border-border/50 pt-3">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Overpayments</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Any amount paid over the current due will be held in your wallet as credit.</p>
                  </div>
                  <div className="space-y-1 border-t border-border/50 pt-3">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Refunds</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Internal refunds are credited back to your wallet instantly.</p>
                  </div>
                </div>
              </CardContent>
           </Card>

           <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 text-center">
             <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Need Assistance?</p>
             <Button variant="outline" className="w-full font-bold h-10 text-xs rounded-xl" asChild>
                <Link href="/student/support">Contact Finance</Link>
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
