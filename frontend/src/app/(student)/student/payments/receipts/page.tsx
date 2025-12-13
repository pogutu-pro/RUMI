'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePayments } from '@/features/payments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Search,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PaymentHistoryPage() {
  const { data: payments, isLoading } = usePayments();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  const filteredPayments = React.useMemo(() => {
    if (!payments) return [];
    
    return payments.filter((payment) => {
      const matchesSearch = payment.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesType = typeFilter === 'all' || payment.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [payments, searchQuery, statusFilter, typeFilter]);

  const stats = React.useMemo(() => {
    if (!payments) return { all: 0, completed: 0, pending: 0, failed: 0 };
    
    return {
      all: payments.length,
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      failed: payments.filter(p => p.status === 'failed').length,
    };
  }, [payments]);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/student/payments">
            <Button variant="ghost" size="sm" className="h-9 px-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Payment History</h1>
            <p className="text-muted-foreground text-sm mt-1 hidden md:block">
              View and download all your payment receipts
            </p>
          </div>
        </div>
        <Button 
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={cn(statusFilter === 'all' && "ring-2 ring-primary")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <p className="text-2xl font-bold mt-1">{stats.all}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(statusFilter === 'completed' && "ring-2 ring-emerald-500")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Completed</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(statusFilter === 'pending' && "ring-2 ring-amber-500")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(statusFilter === 'failed' && "ring-2 ring-red-500")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Failed</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{stats.failed}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Transactions ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="divide-y">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors group"
                >
                  {/* Icon */}
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0",
                    payment.status === 'completed' && "bg-emerald-100 dark:bg-emerald-900/30",
                    payment.status === 'pending' && "bg-amber-100 dark:bg-amber-900/30",
                    payment.status === 'failed' && "bg-red-100 dark:bg-red-900/30"
                  )}>
                    {payment.status === 'completed' && <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                    {payment.status === 'pending' && <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                    {payment.status === 'failed' && <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-base">
                        {payment.type.toUpperCase()} Payment
                      </p>
                      <Badge 
                        variant={payment.status === 'completed' ? 'default' : 'secondary'}
                        className={cn(
                          "ml-2 text-xs",
                          payment.status === 'completed' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
                          payment.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
                          payment.status === 'failed' && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                        )}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(payment.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="uppercase">{payment.method}</span>
                      <span>•</span>
                      <span className="text-xs">{payment.reference}</span>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-base">
                        KES {payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {payment.status === 'completed' && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <Link href={`/student/payments/receipts/${payment.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {payment.status === 'completed' && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">No payments found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Your payment history will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
