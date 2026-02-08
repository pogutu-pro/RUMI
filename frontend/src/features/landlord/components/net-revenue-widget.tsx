'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PriceDisplay } from '@/components/ui/price-display';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Info } from 'lucide-react';
import { useLandlordTransactions } from '@/features/payments/hooks/use-payments';
import { StatusPill } from '@/components/ui/status-pill';
import { Skeleton } from '@/components/ui/skeleton';

export function NetRevenueWidget() {
  // In a real app, this would use a dedicated analytics hook
  const { data: transactions, isLoading } = useLandlordTransactions();

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  // Mock calculation - replace with real backend aggregation
  const totalRevenue = transactions?.reduce((acc: number, t: any) => acc + (t.amount || 0), 0) || 0;
  const platformFees = totalRevenue * 0.05; // Assuming 5% fee
  const netIncome = totalRevenue - platformFees;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Yield</CardTitle>
                <CardDescription className="text-xs">Revenue after platform fees</CardDescription>
            </div>
            <StatusPill status="success" className="bg-success/10 text-success border-success/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5%
            </StatusPill>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">
                    KES {netIncome.toLocaleString()}
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                <div>
                    <span className="text-muted-foreground block text-xs mb-1">Total Collected</span>
                    <span className="font-semibold flex items-center text-success">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        KES {totalRevenue.toLocaleString()}
                    </span>
                </div>
                <div>
                     <span className="text-muted-foreground block text-xs mb-1">Platform Fees</span>
                     <span className="font-semibold flex items-center text-destructive">
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        KES {platformFees.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
