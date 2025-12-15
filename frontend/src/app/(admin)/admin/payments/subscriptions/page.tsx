"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus,
  CreditCard,
  CheckCircle,
  XCircle,
  MoreVertical,
  AlertCircle
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { useAdminSubscriptions, useSubscriptionStats, type AdminSubscription } from "@/features/analytics";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use real API hooks
  const { data: subscriptions = [], isLoading } = useAdminSubscriptions();
  const { data: stats, isLoading: statsLoading } = useSubscriptionStats();

  // Filter subscriptions based on search
  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.planName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 capitalize">Active</Badge>;
      case "past_due":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 capitalize">Past Due</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="capitalize">Cancelled</Badge>;
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 capitalize">Trial</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subscriptions</h1>
          <p className="mt-1 text-muted-foreground">Manage recurring billing and plans.</p>
        </div>
        <div className="flex gap-2">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                New Subscription
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.activeCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : formatCurrency(stats?.monthlyRecurringRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total MRR</p>
            </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Past Due</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {statsLoading ? '...' : stats?.pastDueCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <CardTitle className="text-lg font-semibold">Subscription List</CardTitle>
                 <CardDescription>View and manage subscriber statuses</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscribers..."
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
                    <TableHead>Subscription ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading subscriptions...
                      </TableCell>
                    </TableRow>
                  ) : filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{sub.id}</TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">{sub.userName}</span>
                        </TableCell>
                        <TableCell>{sub.planName}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>{formatCurrency(sub.amount)}</TableCell>
                        <TableCell>{sub.nextBillingDate || 'N/A'}</TableCell>
                        <TableCell>{sub.paymentMethod}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Plan</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Cancel Subscription</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
