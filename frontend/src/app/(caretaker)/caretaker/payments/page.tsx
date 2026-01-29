"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  MoreVertical,
  Smartphone,
  Users,
  Home as HomeIcon,
  Activity,
  Printer,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { useRentPeriods, useRentSummary } from "@/features/payments";
import { toast } from "sonner";
import { PriceDisplay } from "@/components/ui/price-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { motion } from "framer-motion";

export default function CaretakerPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Caretaker visibility is handled by the backend (only their hostel's rent periods)
  const { data: rentPeriods, isLoading: isRentLoading } = useRentPeriods({
     status: statusFilter !== 'all' ? statusFilter : undefined,
     search: searchTerm || undefined
  });
  
  const { data: stats, isLoading: isStatsLoading } = useRentSummary();

  const handleRemindTenant = (periodId: string) => {
    toast.success(`Sending payment reminder for Period #${periodId}...`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 font-sans bg-background"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground uppercase italic">Hostel Rent Roll</h1>
          <p className="text-muted-foreground max-w-xl text-lg font-medium">
            Localized monthly rent ledger for your assigned hostel.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="h-11 px-6 rounded-xl border-border/50 font-black text-foreground shadow-sm uppercase tracking-tight text-xs">
             <Activity className="mr-2 h-4 w-4" /> Collection Report
          </Button>
        </div>
      </motion.div>

       {/* Filters Section */}
       <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Search tenant name or room..." 
                className="pl-10 h-12 rounded-xl border-border bg-card text-base font-medium placeholder:text-muted-foreground/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl bg-card border-border text-base font-bold text-foreground">
              <div className="flex items-center gap-2">
                 <Filter className="h-5 w-5 text-muted-foreground" />
                 <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partial</SelectItem>
              <SelectItem value="due">Due</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
       </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            {
                label: "Hostel Collections",
                value: stats?.total_amount_paid || 0,
                desc: "Total gathered",
                icon: CheckCircle2,
                color: "text-emerald-600"
            },
            {
                label: "Hostel Arrears",
                value: stats?.total_balance || 0,
                desc: `${stats?.overdue_periods || 0} tenants overdue`,
                icon: AlertCircle,
                color: "text-red-600"
            },
            {
                label: "Expected Total",
                value: stats?.total_amount_due || 0,
                desc: "Monthly target",
                icon: CalendarDays,
                color: "text-muted-foreground"
            },
            {
                label: "Efficiency Rate",
                value: stats?.total_amount_due ? Math.round((stats.total_amount_paid / stats.total_amount_due) * 100) : 0,
                desc: "Payment speed",
                icon: Activity,
                color: "text-primary",
                isPercent: true
            }
        ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
                <Card className="border-border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
                        <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none">
                            {stat.label}
                        </CardTitle>
                        <stat.icon className={cn("h-4 w-4 opacity-50", stat.color)} />
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-2xl font-black text-foreground leading-none">
                            {stat.isPercent ? `${stat.value}%` : <PriceDisplay amount={stat.value as number} size="sm" className="p-0 font-black h-auto leading-none" />}
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground mt-1.5 uppercase tracking-tighter">
                            {stat.desc}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
      </div>

      {/* Rent Rolls Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-border shadow-md bg-card overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30 py-4">
                <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Local Rent Ledger
                </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50 border-b border-border">
                        <TableRow>
                            <TableHead className="font-black text-muted-foreground text-[10px] uppercase tracking-wider h-10 px-6">Tenant</TableHead>
                            <TableHead className="font-black text-muted-foreground text-[10px] uppercase tracking-wider h-10">Room</TableHead>
                            <TableHead className="font-black text-muted-foreground text-[10px] uppercase tracking-wider h-10">Month</TableHead>
                            <TableHead className="font-black text-muted-foreground text-[10px] uppercase tracking-wider h-10 text-right">Target</TableHead>
                            <TableHead className="font-black text-muted-foreground text-[10px] uppercase tracking-wider h-10 text-right">Paid</TableHead>
                            <TableHead className="font-black text-muted-foreground text-[10px] uppercase tracking-wider h-10 text-center">Status</TableHead>
                            <TableHead className="text-right font-black text-muted-foreground text-[10px] uppercase tracking-wider h-10 px-6">Ops</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isRentLoading ? (
                            [...Array(6)].map((_, i) => (
                              <TableRow key={i} className="h-14">
                                  <TableCell colSpan={7} className="px-6"><div className="h-4 bg-muted animate-pulse rounded w-full" /></TableCell>
                              </TableRow>
                            ))
                        ) : rentPeriods?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center p-8">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-40">
                                        <Activity className="h-10 w-10 animate-pulse" />
                                        <p className="font-black uppercase text-xs tracking-widest">No local rent records found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rentPeriods?.map((period: any) => (
                                <TableRow key={period.id} className="hover:bg-muted/20 border-b border-border transition-colors h-14">
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[11px]">
                                                {period.student?.user?.first_name?.[0]}{period.student?.user?.last_name?.[0]}
                                            </div>
                                            <div className="flex flex-col leading-tight">
                                                <div className="font-black text-foreground text-sm">{period.student?.user?.first_name} {period.student?.user?.last_name}</div>
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{period.student?.student_id_number || 'No ID'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <HomeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs font-black text-foreground bg-muted px-2 py-0.5 rounded leading-none">
                                                {period.room?.room_number || 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-foreground uppercase tracking-tight">
                                                {format(new Date(period.start_date), 'MMM yyyy')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <PriceDisplay amount={period.amount_due} size="sm" className="p-0 h-auto font-black text-foreground" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <PriceDisplay amount={period.amount_paid} size="sm" className="p-0 h-auto font-black text-emerald-600" />
                                            {period.balance > 0 && (
                                                <div className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                                                    Arrear: KES {period.balance.toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <StatusBadge status={period.status} className="uppercase text-[9px] font-black tracking-widest px-2 h-5" />
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 shadow-xl border-border">
                                                <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">Local Actions</DropdownMenuLabel>
                                                <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer" onClick={() => handleRemindTenant(period.id)}>
                                                    <Smartphone className="mr-2 h-3.5 w-3.5" /> Direct Reminder
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer">
                                                    <Printer className="mr-2 h-3.5 w-3.5" /> Export Mini-Statement
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-xs font-bold text-primary py-2.5 cursor-pointer">
                                                    <ArrowRight className="mr-2 h-3.5 w-3.5" /> Full Ledger Profile
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
