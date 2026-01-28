'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { RentStatusInfo } from '@/features/payments/types';

interface RentOverviewCardProps {
  rentStatus: RentStatusInfo | null;
  loading?: boolean;
}

export function RentOverviewCard({ rentStatus, loading }: RentOverviewCardProps) {
  if (loading) {
    return (
      <Card className="h-full border border-border/50 bg-muted/20 animate-pulse">
        <CardContent className="h-64" />
      </Card>
    );
  }

  const isFullyPaid = rentStatus?.status === 'paid' || (rentStatus?.totalOutstanding ?? 0) <= 0;
  const balance = rentStatus?.totalOutstanding ?? 0;
  const nextDueDate = rentStatus?.nextPaymentDate || 'Not Scheduled';
  
  // Progress calculation (mock visual based on balance)
  const progressValue = isFullyPaid ? 100 : Math.max(5, 100 - (balance / 1000));

  return (
    <Card className="h-full overflow-hidden border border-border/50 shadow-sm bg-card transition-shadow hover:shadow-md">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
           <CardTitle className="text-base font-bold flex items-center gap-2">
             Payment Status
             {isFullyPaid && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
           </CardTitle>
           {!isFullyPaid && (
             <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-100">
               <AlertCircle className="h-3 w-3" />
               Action Required
             </div>
           )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
            Total Balance Due
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tight text-foreground">
              KES {balance.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
           <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
             <span className="text-muted-foreground">Portfolio coverage</span>
             <span className="text-foreground">{Math.round(progressValue)}%</span>
           </div>
           <Progress 
              value={progressValue} 
              className="h-2 bg-muted border border-border/20" 
              indicatorClassName={isFullyPaid ? "bg-emerald-500" : "bg-primary"}
            />
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/50">
           <Calendar className="h-4 w-4 text-muted-foreground" />
           <div className="space-y-0.5">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Next Deadline</p>
             <p className="text-sm font-bold text-foreground">{nextDueDate}</p>
           </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button 
            variant={isFullyPaid ? "outline" : "default"}
            className="w-full font-bold h-11" 
            asChild
        >
          <Link href="/student/payments/new">
            {isFullyPaid ? "View Statement" : "Pay Now"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
