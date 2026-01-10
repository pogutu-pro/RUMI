'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  CreditCard as PaymentIcon,
  ShieldCheck,
  ChevronRight,
  Loader2
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
        toast.error('Receipt PDF not available yet');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to download receipt');
    } finally {
      setIsDownloading(null);
    }
  };

  const rentStatus = dashboardData?.rentStatus;
  const hostelName = dashboardData?.hostelInfo?.name || 'Your Property';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >

      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <Badge variant="outline" className="px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20 mb-2">
            Billing & Ledger
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Payments</h1>
          <p className="text-muted-foreground max-w-xl text-balance font-bold">
            Manage your lease payments, view transaction logs, and handle recurring settings for <span className="text-foreground font-black">{hostelName}</span>.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/20 group"
            asChild
          >
            <Link href={`/student/payments/new?bookingId=${dashboardData?.hostelInfo?.booking_id || 'current'}&amount=${rentStatus?.totalOutstanding || 15000}`}>
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
              Make a Payment
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="h-12 px-6 rounded-xl border-border font-black text-foreground hover:bg-muted"
            asChild
          >
            <Link href="/student/payments/receipts">
              <Download className="h-4 w-4 mr-2" />
              Get Statement
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Main Grid: Stats & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Stats Cards */}
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Paid */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-all active:scale-[0.98] group h-full">
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="p-2.5 bg-emerald-500/10 rounded-xl w-fit">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="text-2xl font-black text-foreground">
                          <span className="text-xs font-black mr-1 text-muted-foreground/60">KES</span>
                          {stats.completed.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Overdue/Balance */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-all active:scale-[0.98] group h-full">
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl w-fit">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Balance Due</p>
                        <p className="text-3xl font-black text-foreground">
                          <span className="text-sm font-black mr-1 text-muted-foreground/60">KES</span>
                          {(rentStatus?.totalOutstanding || stats.pending).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Records */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-all active:scale-[0.98] group h-full">
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="p-2.5 bg-blue-500/10 rounded-xl w-fit">
                        <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Logs</p>
                        <p className="text-2xl font-black text-foreground">
                          {Array.isArray(payments) ? (payments as any[]).length : 0}
                          <span className="text-sm font-black ml-1.5 text-muted-foreground/60">payments</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Activity Section */}
          <motion.div variants={itemVariants} className="pt-2">
            <Card className="border-border bg-card overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between py-6 px-6 border-b border-border">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black flex items-center gap-2 text-foreground">
                    <History className="h-6 w-6 text-emerald-600" />
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-bold">Review your recent apartment billing activities.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-emerald-700 font-black hover:bg-emerald-500/10" asChild>
                  <Link href="/student/payments/receipts">
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : recentPayments.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentPayments.map((payment: any, index: number) => (
                      <div
                        key={payment.id}
                        className="flex items-center gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer"
                      >
                        <div className={cn(
                          "h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                          payment.status === 'completed' && "bg-emerald-500/10 text-emerald-600",
                          payment.status === 'pending' && "bg-amber-500/10 text-amber-600",
                          payment.status === 'failed' && "bg-red-500/10 text-red-600"
                        )}>
                          {payment.status === 'completed' && <CheckCircle className="h-5 w-5" />}
                          {payment.status === 'pending' && <Clock className="h-5 w-5" />}
                          {payment.status === 'failed' && <XCircle className="h-5 w-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-sm text-foreground truncate">
                              {payment.type === 'initial' ? 'Booking Deposit' : payment.type.toUpperCase() + ' Payment'}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1 font-bold">
                            <span>{new Date(payment.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="uppercase tracking-wide">{payment.method}</span>
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <div>
                            <p className="text-lg font-black text-foreground">
                              KES {payment.amount.toLocaleString()}
                            </p>
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-[9px] h-4.5 px-1.5 rounded-md font-black uppercase mt-1",
                                (payment.status === 'completed' || payment.status === 'success') && "bg-emerald-500/10 text-emerald-600",
                                (payment.status === 'pending' || payment.status === 'pending_stk_push') && "bg-amber-500/10 text-amber-600",
                                (payment.status === 'failed' || payment.status === 'cancelled') && "bg-red-500/10 text-red-600"
                              )}
                            >
                              {payment.status === 'pending_stk_push' ? 'Pending STK' : payment.status}
                            </Badge>
                          </div>
                          
                          {(payment.status === 'completed' || payment.status === 'success') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg group/receipt"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadReceipt(payment.id);
                              }}
                              disabled={isDownloading === String(payment.id)}
                            >
                              {isDownloading === String(payment.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Download className="h-3 w-3 mr-1 group-hover/receipt:scale-110 transition-transform" />
                              )}
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-3xl bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground/50">
                      <Wallet className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-black text-foreground">No history found</h3>
                    <p className="text-xs text-muted-foreground max-w-[200px] mt-1 font-bold">Make your first payment to see records here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Actions & Services */}
        <div className="xl:col-span-4 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border border-border bg-card text-card-foreground shadow-xl rounded-2xl overflow-hidden relative group">
              <CardContent className="p-8 relative z-10">
                <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-6" />
                <h3 className="text-2xl font-black mb-2 text-foreground">Secure Gateway</h3>
                <p className="text-muted-foreground text-sm font-black leading-relaxed mb-8">
                  Fast and encrypted payments directly via M-Pesa. Your data is always protected.
                </p>
                <div className="space-y-3">
                   <div className="flex items-center gap-3 bg-muted/30 border border-border p-3 rounded-xl">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-black text-xs text-emerald-700 dark:text-emerald-400">P</div>
                    <div>
                      <p className="text-xs font-black text-foreground">Property Verified</p>
                      <p className="text-[10px] text-muted-foreground font-black">{hostelName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/30 border border-border p-3 rounded-xl">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-black text-xs text-emerald-700 dark:text-emerald-400">S</div>
                    <div>
                      <p className="text-xs font-black text-foreground">STK Immediate</p>
                      <p className="text-[10px] text-muted-foreground font-black">Powered by Daraja API</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Quick Links</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { title: 'Payment Methods', subtitle: 'Manage cards & M-Pesa', icon: CreditCard, link: '/student/payments/methods' },
                { title: 'Billing History', subtitle: 'View past invoices', icon: History, link: '/student/payments/receipts' },
                { title: 'Auto-Pay', subtitle: 'Setup recurring rent', icon: Clock, link: '/student/payments/recurring' },
                { title: 'Support Desk', subtitle: 'Help with billing issues', icon: Info, link: '/student/support' },
              ].map((item, idx) => (
                <Link 
                  key={idx} 
                  href={item.link}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-emerald-500/50 hover:shadow-md transition-all active:scale-[0.98] group"
                >
                  <div className="p-2.5 bg-muted/50 group-hover:bg-emerald-500/10 rounded-xl transition-colors">
                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground font-black">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-emerald-600 transition-colors" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
