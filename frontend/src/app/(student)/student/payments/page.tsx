'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePayments } from '@/features/payments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();

  const stats = React.useMemo(() => {
    // Defensive: ensure payments is actually an array
    const safePayments = Array.isArray(payments) ? (payments as unknown as any[]) : [];
    
    if (safePayments.length === 0) {
      return { total: 0, pending: 0, completed: 0 };
    }
    
    return safePayments.reduce((acc, payment) => {
      const amount = payment?.amount || 0;
      const status = payment?.status;

      acc.total += amount;

      if (status === 'pending') {
        acc.pending += amount;
      } else if (status === 'completed') {
        acc.completed += amount;
      }

      return acc;
    }, { total: 0, pending: 0, completed: 0 });
  }, [payments]);

  const recentPayments = React.useMemo(() => {
    return Array.isArray(payments) ? (payments as unknown as any[]).slice(0, 10) : [];
  }, [payments]);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {/* Mobile Header - Compact */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1 hidden md:block">
          Manage your rent payments and transaction history
        </p>
      </div>

      {/* Primary CTA - Mobile Prominent */}
      <Button 
        asChild 
        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-12 md:h-10 text-base md:text-sm font-semibold shadow-lg shadow-emerald-600/20"
      >
        <Link href="/student/payments/new">
          <Wallet className="h-5 w-5 mr-2" />
          Pay Rent Now
        </Link>
      </Button>

      {/* Stats - Mobile 1 column, Desktop 3 columns */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        {/* Total Paid */}
        <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-background border-emerald-100 dark:border-emerald-900/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  KES {stats.completed.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-background border-amber-100 dark:border-amber-900/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                  KES {stats.pending.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl md:text-3xl font-bold mt-1">
                  {Array.isArray(payments) ? (payments as unknown as any[]).length : 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile Horizontal Scroll */}
      <div className="md:hidden -mx-3 px-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button variant="outline" className="flex-shrink-0 h-10 px-4 text-sm" asChild>
            <Link href="/student/payments/methods">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Methods
            </Link>
          </Button>
          <Button variant="outline" className="flex-shrink-0 h-10 px-4 text-sm" asChild>
            <Link href="/student/payments/recurring">
              <Calendar className="h-4 w-4 mr-2" />
              Auto-pay
            </Link>
          </Button>
          <Button variant="outline" className="flex-shrink-0 h-10 px-4 text-sm">
            <Download className="h-4 w-4 mr-2" />
            Receipts
          </Button>
        </div>
      </div>

      {/* Desktop Quick Actions */}
      <div className="hidden md:flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/student/payments/methods">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Methods
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/student/payments/recurring">
            <Calendar className="h-4 w-4 mr-2" />
            Auto-pay Settings
          </Link>
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Receipts
        </Button>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">Transaction History</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
              <Link href="/student/payments/history">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : recentPayments.length > 0 ? (
            <div className="divide-y">
              {recentPayments.map((payment: any, index: number) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 p-3 md:p-4 hover:bg-muted/50 transition-colors active:bg-muted"
                >
                  {/* Icon */}
                  <div className={cn(
                    "h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center flex-shrink-0",
                    payment.status === 'completed' && "bg-emerald-100 dark:bg-emerald-900/30",
                    payment.status === 'pending' && "bg-amber-100 dark:bg-amber-900/30",
                    payment.status === 'failed' && "bg-red-100 dark:bg-red-900/30"
                  )}>
                    {payment.status === 'completed' && <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 dark:text-emerald-400" />}
                    {payment.status === 'pending' && <Clock className="h-5 w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" />}
                    {payment.status === 'failed' && <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-sm md:text-base truncate">
                        {payment.type.toUpperCase()} Payment
                      </p>
                      <Badge 
                        variant={payment.status === 'completed' ? 'default' : 'secondary'}
                        className={cn(
                          "text-[10px] ml-2 flex-shrink-0",
                          payment.status === 'completed' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
                          payment.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
                          payment.status === 'failed' && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                        )}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(payment.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="uppercase">{payment.method}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm md:text-base">
                      KES {payment.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground hidden md:block">
                      {payment.reference}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">No payments yet</p>
              <Button asChild size="sm">
                <Link href="/student/payments/new">Make Your First Payment</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card - Hidden on Mobile */}
      <Card className="hidden md:block bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Need help with payments?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Contact support for assistance with payment issues or questions.
            </p>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href="/student/support">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
