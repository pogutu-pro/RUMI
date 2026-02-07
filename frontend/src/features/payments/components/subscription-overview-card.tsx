'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Bed, Calendar, Info } from 'lucide-react';
import { useSubscriptionAccrual } from '../hooks/use-subscription-accrual';
import { format } from 'date-fns';

interface SubscriptionOverviewCardProps {
  hostelId: string;
}

export function SubscriptionOverviewCard({ hostelId }: SubscriptionOverviewCardProps) {
  const { data: accrual, isLoading } = useSubscriptionAccrual();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    );
  }

  if (!accrual) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="py-12 text-center">
          <p className="text-zinc-500">Billing information unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-zinc-900/50 backdrop-blur-sm shadow-2xl overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Billing Accrual</CardTitle>
              <CardDescription className="text-zinc-400 text-xs">Based on actual occupancy</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider">
            Real-time
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white tabular-nums tracking-tighter">
              {formatCurrency(accrual.projected_accrual)}
            </span>
            <span className="text-zinc-500 text-sm font-medium">unbilled</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-zinc-400 text-sm bg-white/5 w-fit px-2 py-1 rounded-md border border-white/10">
            <Calendar className="w-3.5 h-3.5" />
            <span>Since {format(new Date(accrual.period_start), 'MMMM d')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <div className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
              <Bed className="w-3 h-3" />
              Occupied bed-days
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {accrual.total_occupied_bed_days}
            </div>
          </div>
          <div className="space-y-1 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <div className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              Est. Invoice (1st)
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {formatCurrency(accrual.projected_accrual * 1.2)}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800">
           <div className="space-y-2">
             <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
               <span>Usage by Hostel</span>
               <span>Bed-Days</span>
             </div>
             {accrual.hostel_breakdown.map((hostel) => (
               <div key={hostel.hostel__name} className="flex justify-between items-center py-2">
                 <span className="text-zinc-300 text-sm">{hostel.hostel__name}</span>
                 <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono">
                   {hostel.bed_days}
                 </Badge>
               </div>
             ))}
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
