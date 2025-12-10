"use client";

import { useState } from "react";
import { 
  Download, 
  Search, 
  Filter, 
  ArrowUpRight,
  DollarSign,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionTable } from "@/components/admin/transaction-table";
import { usePayments, usePaymentStats } from "@/hooks/use-payments";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: payments, isLoading } = usePayments();
  const { data: stats } = usePaymentStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
          <p className="mt-2 text-muted-foreground">Monitor transactions, refunds, and financial reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  KES {(stats?.totalRevenue || 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-full">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  KES {(stats?.pendingAmount || 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-amber-600 font-medium">
              15 transactions pending
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Payments</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  KES {(stats?.failedAmount || 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
              Last 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Recent Transactions</CardTitle>
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
          <TransactionTable transactions={payments || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
