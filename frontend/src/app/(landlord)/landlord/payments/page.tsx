'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Filter, 
  ArrowUpRight, 
  MoreVertical,
  Printer,
  CalendarDays,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Smartphone,
  Users,
  Home as HomeIcon,
  CreditCard as WalletIcon,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRentPeriods, useRentSummary } from '@/features/payments';
import { useHostels } from '@/features/hostels';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/ui/price-display';
import { StatusBadge } from '@/components/ui/status-badge';

export default function PaymentsPage() {
  const [selectedHostel, setSelectedHostel] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const { data: hostelsData } = useHostels();
  const hostels = hostelsData?.results || [];

  // Fetch Rent Periods (The new Ledger)
  const { data: rentPeriods, isLoading: isRentLoading } = useRentPeriods({
     hostel_id: selectedHostel !== 'all' ? selectedHostel : undefined,
     status: statusFilter !== 'all' ? statusFilter : undefined,
     search: searchTerm || undefined
  });
  
  const { data: stats } = useRentSummary();

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
      className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 font-sans"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white uppercase italic">Rent Ledger</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl text-lg font-medium">
            Consolidated view of monthly rent obligations and payments.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-300 dark:border-slate-800 font-extrabold text-slate-900 dark:text-slate-200 shadow-sm">
             <FileText className="mr-2 h-5 w-5" /> Export Rent Roll
          </Button>
        </div>
      </motion.div>

       {/* Filters Section */}
       <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <Input 
                placeholder="Search tenant name or reference..." 
                className="pl-10 h-12 rounded-xl border-slate-300 dark:border-slate-800 bg-card text-base font-medium placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           <Select value={selectedHostel} onValueChange={setSelectedHostel}>
            <SelectTrigger className="w-full sm:w-[250px] h-12 rounded-xl bg-card border-slate-300 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                 <Building2 className="h-5 w-5 text-slate-500" />
                 <SelectValue placeholder="All Hostels" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              {hostels.map(hostel => (
                  <SelectItem key={hostel.id} value={hostel.id.toString()}>{hostel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl bg-card border-slate-300 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                 <Filter className="h-5 w-5 text-slate-500" />
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
                label: "Total Paid",
                value: stats?.total_amount_paid || 0,
                desc: "Collected funds",
                icon: CheckCircle2,
                color: "text-emerald-600 dark:text-emerald-400"
            },
            {
                label: "Outstanding",
                value: stats?.total_balance || 0,
                desc: `${stats?.overdue_periods || 0} overdue periods`,
                icon: AlertCircle,
                color: "text-red-600 dark:text-red-400"
            },
            {
                label: "Monthly Target",
                value: stats?.total_amount_due || 0,
                desc: "Total expected",
                icon: CalendarDays,
                color: "text-slate-600 dark:text-slate-400"
            },
            {
                label: "Collection Rate",
                value: stats?.total_amount_due ? Math.round((stats.total_amount_paid / stats.total_amount_due) * 100) : 0,
                desc: "Performance index",
                icon: ArrowUpRight,
                color: "text-primary",
                isPercent: true
            }
        ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-[10px] uppercase font-black text-slate-500 tracking-widest">
                            {stat.label}
                        </CardTitle>
                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-950 dark:text-white">
                            {stat.isPercent ? `${stat.value}%` : <PriceDisplay amount={stat.value as number} size="sm" className="p-0 font-black h-auto" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">
                            {stat.desc}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
      </div>

      {/* Rent Rolls Table */}
      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-card overflow-hidden">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 py-4">
                <CardTitle className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Rent Rolls (Monthly Ledger)
                </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-100/50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                        <TableRow>
                            <TableHead className="font-black text-slate-600 dark:text-white text-[10px] uppercase tracking-wider h-10">Tenant</TableHead>
                            <TableHead className="font-black text-slate-600 dark:text-white text-[10px] uppercase tracking-wider h-10">Room / Bed</TableHead>
                            <TableHead className="font-black text-slate-600 dark:text-white text-[10px] uppercase tracking-wider h-10">Period</TableHead>
                            <TableHead className="font-black text-slate-600 dark:text-white text-[10px] uppercase tracking-wider h-10">Obligation</TableHead>
                            <TableHead className="font-black text-slate-600 dark:text-white text-[10px] uppercase tracking-wider h-10">Paid</TableHead>
                            <TableHead className="font-black text-slate-600 dark:text-white text-[10px] uppercase tracking-wider h-10">Status</TableHead>
                            <TableHead className="text-right font-black text-slate-600 dark:text-white text-[10px] uppercase tracking-wider h-10">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isRentLoading ? (
                            [...Array(5)].map((_, i) => (
                              <TableRow key={i}>
                                  <TableCell colSpan={7} className="h-12"><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                              </TableRow>
                            ))
                        ) : rentPeriods?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                            <Search className="h-5 w-5" />
                                        </div>
                                        <p className="font-bold">No rent records found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rentPeriods?.map((period: any) => (
                                <TableRow key={period.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                                                {period.student?.user?.first_name?.[0]}{period.student?.user?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 dark:text-white text-sm">{period.student?.user?.first_name} {period.student?.user?.last_name}</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">{period.student?.student_id_number || 'No ID'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <HomeIcon className="h-3 w-3 text-slate-400" />
                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                {period.room?.room_number || 'N/A'} - Bed {period.bed_slot_id || '1'}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-bold mt-0.5 truncate max-w-[120px]">{period.hostel?.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-tighter">
                                                {format(new Date(period.start_date), 'MMM yy')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <PriceDisplay amount={period.amount_due} size="sm" className="p-0 h-auto font-black text-slate-900 dark:text-slate-200" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <PriceDisplay amount={period.amount_paid} size="sm" className="p-0 h-auto font-black text-emerald-600" />
                                            {period.balance > 0 && (
                                                <div className="text-[9px] font-bold text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-2 w-2" />
                                                    Pending: KES {period.balance.toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={period.status} className="uppercase text-[9px] font-black tracking-widest px-2" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">Period Actions</DropdownMenuLabel>
                                                <DropdownMenuItem className="text-xs font-bold" onClick={() => handleRemindTenant(period.id)}>
                                                    <Smartphone className="mr-2 h-3.5 w-3.5" /> Send Reminder
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs font-bold">
                                                    <Printer className="mr-2 h-3.5 w-3.5" /> Statement
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-xs font-bold text-primary">
                                                    <ArrowRight className="mr-2 h-3.5 w-3.5" /> View Ledger
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
