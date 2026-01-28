'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePayments } from '@/features/payments';
import { useStudentDashboard } from '@/features/student/hooks/use-student-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  Receipt,
  History,
  Info,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Loader2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { paymentsApi } from '@/features/payments';

export default function PaymentsPage() {
  const [isDownloading, setIsDownloading] = React.useState<string | null>(null);
  const { data: payments, isLoading: isPaymentsLoading } = usePayments();
  const { data: dashboardData, isLoading: isDashboardLoading } = useStudentDashboard();

  const isLoading = isPaymentsLoading || isDashboardLoading;

  const stats = React.useMemo(() => {
    const safePayments = Array.isArray(payments) ? (payments as unknown as any[]) : [];
    
    if (safePayments.length === 0) {
      return { total: 0, pending: 0, completed: 0 };
    }
    
    return safePayments.reduce((acc, payment) => {
      const amount = payment?.amount || 0;
      const status = payment?.status;

      acc.total += amount;

      if (status === 'pending' || status === 'pending_stk_push') {
        acc.pending += amount;
      } else if (status === 'completed' || status === 'success') {
        acc.completed += amount;
      }

      return acc;
    }, { total: 0, pending: 0, completed: 0 });
  }, [payments]);

  const recentPayments = React.useMemo(() => {
    return Array.isArray(payments) ? (payments as unknown as any[]).slice(0, 10) : [];
  }, [payments]);

  const handleDownloadReceipt = async (transactionId: string | number) => {
    try {
      setIsDownloading(String(transactionId));
      const receipt = await paymentsApi.getReceipt(transactionId);
      if (receipt?.pdf_file) {
        window.open(receipt.pdf_file, '_blank');
      } else {
        toast.error('Receipt record not yet generated');
      }
    } catch (error: any) {
      toast.error('Failed to retrieve receipt document');
    } finally {
      setIsDownloading(null);
    }
  };

  const rentStatus = dashboardData?.rentStatus;
  const hostelName = (dashboardData as any)?.hostelInfo?.name || 'Assigned Property';

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4 sm:px-6">

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border/50 pb-10 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Financial Ledger</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Review your rental obligations, transaction history, and payment configurations for <span className="text-foreground font-bold">{hostelName}</span>.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            size="lg"
            className="font-bold h-11 px-6 rounded-xl shadow-sm group"
            asChild
          >
            <Link href={`/student/payments/new?bookingId=${(dashboardData as any)?.hostelInfo?.booking_id || 'current'}&amount=${rentStatus?.totalOutstanding || 15000}`}>
              <Plus className="h-4 w-4 mr-2" />
              Initiate Payment
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="h-11 px-6 rounded-xl border-border/50 font-bold"
            asChild
          >
            <Link href="/student/payments/receipts">
              <FileText className="h-4 w-4 mr-2" />
              Export Statement
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Grid: Stats & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Stats Cards */}
        <div className="xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Paid */}
            <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="p-2.5 bg-muted rounded-xl w-fit border border-border/50">
                            <TrendingUp className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Total Remitted</p>
                            <p className="text-2xl font-black text-foreground">
                                <span className="text-xs font-bold mr-1 text-muted-foreground opacity-60">KES</span>
                                {stats.completed.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Overdue/Balance */}
            <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-foreground bg-primary/5 border-2 border-primary/20 rounded-xl relative overflow-hidden">
                    <div className="space-y-4">
                        <div className="p-2.5 bg-background rounded-xl w-fit border border-border/50 shadow-sm">
                            <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1">Outstanding Balance</p>
                            <p className="text-3xl font-black">
                                <span className="text-sm font-bold mr-1 opacity-60">KES</span>
                                {(rentStatus?.totalOutstanding || stats.pending).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Records */}
            <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="p-2.5 bg-muted rounded-xl w-fit border border-border/50">
                            <Receipt className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Transaction Volume</p>
                            <p className="text-2xl font-black text-foreground">
                                {Array.isArray(payments) ? (payments as any[]).length : 0}
                                <span className="text-sm font-bold ml-1.5 text-muted-foreground opacity-60">Entries</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Activity Section */}
          <Card className="border border-border/50 bg-card overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-6 px-6 border-b border-border/50 bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-xs font-medium">Verified transaction logs for your current rental period.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="font-bold text-xs" asChild>
                <Link href="/student/payments/receipts">
                  View Full Statement
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-2 w-1/4" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentPayments.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentPayments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 border",
                        payment.status === 'completed' && "bg-background border-border/50 text-foreground",
                        payment.status === 'pending' && "bg-muted border-border/50 text-muted-foreground",
                        payment.status === 'failed' && "bg-destructive/10 border-destructive/20 text-destructive"
                      )}>
                        {payment.status === 'completed' && <CheckCircle className="h-4 w-4" />}
                        {payment.status === 'pending' && <Clock className="h-4 w-4" />}
                        {payment.status === 'failed' && <XCircle className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">
                          {payment.type === 'initial' ? 'Initial Deposit' : payment.type.toUpperCase() + ' Payment'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                             {new Date(payment.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                           </p>
                           <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                             {payment.method}
                           </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5 min-w-[120px]">
                        <p className="text-base font-black text-foreground">
                            KES {payment.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                            {(payment.status === 'completed' || payment.status === 'success') && (
                                <button 
                                    className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline px-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadReceipt(payment.id);
                                    }}
                                    disabled={isDownloading === String(payment.id)}
                                >
                                    {isDownloading === String(payment.id) ? 'Downloading...' : 'Receipt'}
                                </button>
                            )}
                            <Badge 
                                variant="outline"
                                className={cn(
                                    "text-[9px] h-4.5 px-2 rounded-md font-bold uppercase",
                                    (payment.status === 'completed' || payment.status === 'success') && "border-emerald-500/30 text-emerald-600 bg-emerald-50/50",
                                    (payment.status === 'pending' || payment.status === 'pending_stk_push') && "border-amber-500/30 text-amber-600 bg-amber-50/50",
                                    (payment.status === 'failed' || payment.status === 'cancelled') && "border-destructive/30 text-destructive bg-destructive/5"
                                )}
                            >
                                {payment.status === 'pending_stk_push' ? 'STK Pending' : payment.status}
                            </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground/30">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">No records detected</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] mt-1 font-medium">All financial transactions will be cataloged here.</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                      <p className="text-xs font-bold text-foreground">STK Push / Daraja Core</p>
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
