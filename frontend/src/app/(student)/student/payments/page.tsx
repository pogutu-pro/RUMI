'use client';

import * as React from 'react';
import Link from 'next/link';
import { useStudentDashboard } from '@/features/student/hooks/use-student-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus,
  FileText,
  ShieldCheck,
  CreditCard,
  History,
  Clock,
  Info,
  ChevronRight,
  Building
} from 'lucide-react';

import { RentOverview } from '@/features/payments/components/rent-overview';
import { RentHistoryTimeline } from '@/features/payments/components/rent-history-timeline';

export default function PaymentsPage() {
  const { data: dashboardData } = useStudentDashboard();
  const hostelName = (dashboardData as any)?.hostelInfo?.name || 'Assigned Property';
  const roomNumber = (dashboardData as any)?.hostelInfo?.roomNumber || 'N/A';
  const bedId = (dashboardData as any)?.hostelInfo?.bedId || 'N/A';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6">

      {/* Header Section - High Density */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-border/10 pb-6 pt-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-70">
            <Building className="h-3 w-3" />
            Canonical Space ID
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase italic leading-none">
            {hostelName} <span className="text-muted-foreground/30 mx-1">/</span> Room {roomNumber} <span className="text-muted-foreground/30 mx-1">/</span> Bed {bedId}
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm"
            className="font-black h-9 px-4 rounded-lg shadow-lg shadow-primary/20 uppercase tracking-tight italic"
            asChild
          >
            <Link href="/student/payments/new">
              <Plus className="h-4 w-4 mr-2" />
              Pay Now
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 px-4 rounded-lg border-2 border-border/50 font-black uppercase tracking-tight italic"
            asChild
          >
            <Link href="/student/payments/receipts">
              <FileText className="h-4 w-4 mr-2" />
              Export Statements
            </Link>
          </Button>
        </div>
      </div>


      {/* Rent Overview & Wallet */}
      <RentOverview />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Rent History */}
        <div className="xl:col-span-8 space-y-8">
           <RentHistoryTimeline />
        </div>

        {/* Right Column: Actions & Services */}
        <div className="xl:col-span-4 space-y-8">
          <Card className="border border-border/50 bg-card shadow-sm rounded-xl overflow-hidden relative group">
            <CardContent className="p-8">
              <ShieldCheck className="h-8 w-8 text-foreground mb-6 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Verified Ledger</h3>
              <p className="text-muted-foreground text-xs font-medium leading-relaxed mb-8">
                All financial data is encrypted and reconciled in real-time. Direct integration with official payment gateways ensures structural integrity.
              </p>
              <div className="space-y-3">
                 <div className="flex items-center gap-3 bg-muted/30 border border-border/50 p-4 rounded-xl">
                    <div className="h-8 w-8 rounded-lg bg-background border border-border/50 flex items-center justify-center font-bold text-xs">01</div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Secured Node</p>
                      <p className="text-xs font-bold text-foreground">{hostelName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/30 border border-border/50 p-4 rounded-xl">
                    <div className="h-8 w-8 rounded-lg bg-background border border-border/50 flex items-center justify-center font-bold text-xs">02</div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Processor</p>
                      <p className="text-xs font-bold text-foreground">STK Push / Paybill / Wallet</p>
                    </div>
                  </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Functional Links</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { title: 'Payment Registry', subtitle: 'Method management', icon: CreditCard, link: '/student/payments/methods' },
                { title: 'Billing Archives', subtitle: 'Historical records', icon: History, link: '/student/payments/receipts' },
                { title: 'Recurring Setup', subtitle: 'Automatic billing', icon: Clock, link: '/student/payments/recurring' },
                { title: 'Support Terminal', subtitle: 'Financial assistance', icon: Info, link: '/student/support' },
              ].map((item, idx) => (
                <Link 
                  key={idx} 
                  href={item.link}
                  className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl hover:bg-muted/20 transition-all group"
                >
                  <div className="p-2.5 bg-muted rounded-lg transition-colors group-hover:bg-background group-hover:border border-border/50">
                    <item.icon className="h-4 w-4 text-foreground opacity-70" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

