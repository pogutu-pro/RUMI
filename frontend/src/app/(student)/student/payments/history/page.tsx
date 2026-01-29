'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { RentHistoryTimeline } from '@/features/payments/components/rent-history-timeline';

export default function RentHistoryPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-4">
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
            <h1 className="text-2xl font-bold tracking-tight">Rent History</h1>
            <p className="text-sm text-muted-foreground">Complete record of your rental periods and payments</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold h-9">
             <Filter className="h-4 w-4 mr-2" />
             Filter
          </Button>
          <Button variant="outline" size="sm" className="font-bold h-9">
             <Download className="h-4 w-4 mr-2" />
             Export
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-sm">
        <RentHistoryTimeline />
      </div>

      <div className="rounded-2xl bg-primary/5 p-6 border border-primary/10">
        <h3 className="text-sm font-bold text-primary mb-2">About your Statement</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This ledger displays all rent periods generated for your current and past bookings. 
          Each period includes associated M-Pesa transactions and any room transfers. 
          If you notice any discrepancies, please contact your hostel caretaker or support.
        </p>
      </div>
    </div>
  );
}
