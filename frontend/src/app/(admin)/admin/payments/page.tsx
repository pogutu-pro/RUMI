"use client";

import { useState } from "react";
import { 
  Download, 
  Search, 
  Filter, 
  ArrowUpRight,
  DollarSign,
  Calendar,
  MoreVertical,
  Building2,
  Users,
  Activity,
  FileText,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRentPeriods, useRentSummary } from "@/features/payments";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceDisplay } from "@/components/ui/price-display";
import { StatusBadge } from "@/components/ui/status-badge";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: rentPeriods, isLoading: isLoadingPeriods } = useRentPeriods({
    search: searchTerm || undefined
  });
  const { data: stats, isLoading: isLoadingStats } = useRentSummary();

  if (isLoadingStats || isLoadingPeriods) {
      return (
          <div className="space-y-6 max-w-[1600px] mx-auto p-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-6 md:grid-cols-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
              <Skeleton className="h-96 rounded-xl" />
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-6 bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">Global Finance Control</h1>
          <p className="mt-1 text-muted-foreground font-medium">Platform-wide rent ledger and revenue monitoring.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-border/50 font-bold h-11 px-6 rounded-xl">
            <Download className="h-4 w-4" />
            Export Master Roll
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Gross Revenue",
            value: stats?.total_amount_paid || 0,
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-500/5",
            desc: "Successfully collected"
          },
          {
            label: "Total Outstanding",
            value: stats?.total_balance || 0,
            icon: Activity,
            color: "text-red-600",
            bg: "bg-red-500/5",
            desc: "Pending rent across all hostels"
          },
          {
            label: "Active Periods",
            value: stats?.total_periods || 0,
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-500/5",
            desc: "Managed rent records",
            isCount: true
          },
          {
            label: "Recovery Rate",
            value: stats?.total_amount_due ? Math.round((stats.total_amount_paid / stats.total_amount_due) * 100) : 0,
            icon: ArrowUpRight,
            color: "text-primary",
            bg: "bg-primary/5",
            desc: "Efficiency index",
            isPercent: true
          }
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <div className="text-2xl font-black text-foreground mt-1">
                    {stat.isPercent ? `${stat.value}%` : 
                     stat.isCount ? stat.value.toLocaleString() : 
                     <PriceDisplay amount={stat.value as number} size="sm" className="p-0 font-black h-auto" />}
                  </div>
                </div>
                <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </div>
              <p className="mt-2 text-[10px] font-bold text-muted-foreground/70">
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 bg-muted/30 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <CardTitle className="text-lg font-black flex items-center gap-2">
                   <Activity className="h-5 w-5 text-primary" />
                   Master Rent Ledger
                 </CardTitle>
                 <CardDescription className="font-medium text-[12px]">Direct oversight of all rent obligations platform-wide</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenant, ID, or hostel..."
                  className="pl-10 h-10 bg-background border-border/50 font-medium text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 border-border/50">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 border-b h-10">
                    <TableHead className="text-[10px] font-black uppercase tracking-wider px-6">Tenant / Hostel</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Room</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Period</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-right">Target</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-right">Collected</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-center">Status</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-wider px-6">Ops</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentPeriods?.map((period: any) => (
                    <TableRow key={period.id} className="hover:bg-muted/20 h-14 border-b border-border/30 transition-colors">

                      <TableCell className="px-6">
                          <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary">
                                {period.student?.user?.first_name?.[0]}{period.student?.user?.last_name?.[0]}
                              </div>
                              <div className="flex flex-col">
                                  <span className="font-black text-sm text-foreground leading-tight">{period.student?.user?.first_name} {period.student?.user?.last_name}</span>
                                  <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5">
                                    <Building2 className="h-2.5 w-2.5" />
                                    {period.hostel?.name}
                                  </span>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>
                          <Badge variant="secondary" className="font-black text-[10px] rounded h-5 bg-muted/50 border-none">
                              {period.room?.room_number || 'N/A'}
                          </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-tight">
                              {format(new Date(period.start_date), "MMM yyyy")}
                          </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <PriceDisplay amount={period.amount_due} size="sm" className="p-0 font-black h-auto text-foreground" />
                      </TableCell>
                      <TableCell className="text-right">
                        <PriceDisplay amount={period.amount_paid} size="sm" className="p-0 font-black h-auto text-emerald-600" />
                      </TableCell>
                      <TableCell className="text-center">
                          <StatusBadge 
                            status={period.status} 
                            className="uppercase text-[9px] font-black tracking-widest px-2 h-5"
                          />
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">Finance Audit</DropdownMenuLabel>
                            <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer">
                              <Activity className="mr-2 h-3.5 w-3.5" /> View Ledger Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer">
                              <FileText className="mr-2 h-3.5 w-3.5" /> Inspect Transactions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-bold text-destructive py-2.5 cursor-pointer">
                              <AlertCircle className="mr-2 h-3.5 w-3.5" /> Flag for Manual Audit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rentPeriods?.length && (
                      <TableRow>
                          <TableCell colSpan={7} className="h-48 text-center text-muted-foreground font-bold p-8">
                              <div className="flex flex-col items-center gap-3 opacity-40">
                                <Activity className="h-10 w-10 animate-pulse" />
                                <span className="uppercase text-xs tracking-widest font-black">No rent records found in the master ledger.</span>
                              </div>
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
