"use client";

import { useState } from "react";
import { 
  Download, 
  Search, 
  Filter, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  Wallet,
  MoreVertical,
  Calendar,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePayments, usePaymentStats } from "@/features/payments";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: payments, isLoading: isLoadingPayments } = usePayments();
  const { data: stats, isLoading: isLoadingStats } = usePaymentStats();

  if (isLoadingStats || isLoadingPayments) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-6 md:grid-cols-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
              <Skeleton className="h-96 rounded-xl" />
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments & Finance</h1>
          <p className="mt-1 text-muted-foreground">Monitor transactions, revenue, and financial health.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  KES {(stats?.totalRevenue || 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-1 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  KES {(stats?.pendingAmount || 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-amber-600 font-medium bg-amber-50 w-fit px-2 py-1 rounded-full dark:bg-amber-900/20 dark:text-amber-400">
              <Clock className="w-3 h-3 mr-1" />
              15 transactions pending
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  KES {(stats?.totalRevenue ? stats.totalRevenue * 0.9 : 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
             <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
              After fees & tax
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
                 <CardDescription>View all financial activity</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs text-muted-foreground">{payment.reference || payment.id.substring(0,8)}</TableCell>
                      <TableCell>
                          <div className="flex flex-col">
                              <span className="font-medium text-foreground">{payment.user?.name || 'Unknown User'}</span>
                              <span className="text-xs text-muted-foreground">{payment.user?.email}</span>
                          </div>
                      </TableCell>
                      <TableCell>
                          <Badge variant="secondary" className="capitalize font-normal">
                              {payment.type}
                          </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(payment.date), "MMM d, yyyy")}
                          </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        KES {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                                "capitalize",
                                payment.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                payment.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400" :
                                "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                            )}
                          >
                              {payment.status}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {payment.status === 'completed' && <DropdownMenuItem className="text-destructive">Initiate Refund</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!payments?.length && (
                      <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              No transactions found.
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
