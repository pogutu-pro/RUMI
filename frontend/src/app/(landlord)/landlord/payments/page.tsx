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
  Smartphone
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
import { useLandlordTransactions, usePaymentStats } from '@/features/payments';
import { useHostels } from '@/features/hostels';
import { MpesaConfigModal } from '@/features/payments/components/mpesa-config-modal';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const [selectedHostel, setSelectedHostel] = React.useState<string>("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isMpesaModalOpen, setIsMpesaModalOpen] = React.useState(false);

  const { data: hostelsData } = useHostels();
  const hostels = hostelsData?.results || [];

  // Filter Transactions by Hostel via API
  const { data: transactionsData, isLoading: isTransactionsLoading } = useLandlordTransactions({
     hostel_id: selectedHostel || undefined,
     status: statusFilter !== 'all' ? statusFilter : undefined
  });
  
  const transactions = transactionsData || [];
  const { data: stats } = usePaymentStats();

  const handleGenerateReceipt = (id: string) => {
    toast.success(`Generating receipt for Transaction #${id}...`);
    // Logic to open receipt modal or download PDF
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
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">Payments & Transactions</h1>
          <p className="text-slate-700 dark:text-slate-300 max-w-xl text-lg md:text-xl font-medium">
            Manage rent collection, track income, and generate receipts.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md border-0"
            onClick={() => setIsMpesaModalOpen(true)}
          >
            <Smartphone className="mr-2 h-5 w-5" /> M-Pesa Settings
          </Button>
          <MpesaConfigModal isOpen={isMpesaModalOpen} onClose={() => setIsMpesaModalOpen(false)} />
          <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-300 dark:border-slate-800 font-extrabold text-slate-900 dark:text-slate-200 shadow-sm">
             <FileText className="mr-2 h-5 w-5" /> Export Ledger
          </Button>
        </div>
      </motion.div>

       {/* Filters Section (Per Hostel) */}
       <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <Input 
                placeholder="Search tenant name, email or reference..." 
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
              <SelectItem value="completed">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
       </motion.div>

      {/* KPI Cards (High Contrast, Standard UI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
            {
                label: "Total Collected",
                value: `KES ${stats?.totalRevenue?.toLocaleString() || '0'}`,
                desc: "This month",
                icon: DollarSign,
                color: "text-emerald-600 dark:text-emerald-400"
            },
            {
                label: "Pending Rent",
                value: `KES ${stats?.pendingAmount?.toLocaleString() || '0'}`,
                desc: `${stats?.pendingCount || 0} invoices due`,
                icon: Clock,
                color: "text-amber-600 dark:text-amber-400"
            },
            {
                label: "Failed Payments",
                value: `KES ${stats?.failedAmount?.toLocaleString() || '0'}`,
                desc: "Action required",
                icon: AlertCircle,
                color: "text-red-600 dark:text-red-400"
            }
        ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
                <Card className="border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-extrabold text-slate-700 dark:text-slate-300">
                            {stat.label}
                        </CardTitle>
                        <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl md:text-4xl font-black text-slate-950 dark:text-white">
                            {stat.value}
                        </div>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1">
                            {stat.desc}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
      </div>

      {/* Transactions Table */}
      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-card overflow-hidden">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 py-5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-extrabold text-slate-950 dark:text-white">Transaction History</CardTitle>
                        <CardDescription className="text-slate-700 dark:text-slate-400 font-medium">Recent rent payments and deposits</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-100 dark:bg-slate-900/70">
                        <TableRow className="border-b border-slate-200 dark:border-slate-800">
                            <TableHead className="w-[180px] font-black text-slate-950 dark:text-slate-200 text-sm uppercase tracking-wider">Transaction ID</TableHead>
                            <TableHead className="font-black text-slate-950 dark:text-slate-200 text-sm uppercase tracking-wider">Tenant</TableHead>
                            <TableHead className="font-black text-slate-950 dark:text-slate-200 text-sm uppercase tracking-wider">Amount</TableHead>
                            <TableHead className="font-black text-slate-950 dark:text-slate-200 text-sm uppercase tracking-wider">Status</TableHead>
                            <TableHead className="font-black text-slate-950 dark:text-slate-200 text-sm uppercase tracking-wider">Date</TableHead>
                            <TableHead className="text-right font-black text-slate-950 dark:text-slate-200 text-sm uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isTransactionsLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                    Loading transactions...
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                            <Search className="h-5 w-5" />
                                        </div>
                                        <p>No transactions found for this filter.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx: any) => (
                                <TableRow key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                    <TableCell className="font-mono text-sm font-bold text-slate-800 dark:text-slate-300">
                                        {tx.reference || tx.id.substring(0, 8).toUpperCase()}
                                        <div className="text-[11px] text-slate-600 dark:text-slate-500 mt-1 font-extrabold uppercase">{tx.method || 'M-PESA'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-black text-slate-950 dark:text-white text-base">{tx.user?.name || 'Unknown User'}</div>
                                        <div className="text-sm text-slate-700 dark:text-slate-400 font-medium">{tx.user?.email || 'No Email'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-black text-slate-950 dark:text-white text-base">KES {tx.amount?.toLocaleString()}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "uppercase text-[10px] font-bold border-0",
                                            tx.status === 'completed' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                                            tx.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                                            tx.status === 'failed' && "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                        )}>
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-base text-slate-800 dark:text-slate-300 font-bold">
                                        {format(new Date(tx.date || Date.now()), 'MMM d, yyyy')}
                                        <div className="text-xs text-slate-600 dark:text-slate-500 font-extrabold">{format(new Date(tx.date || Date.now()), 'h:mm a')}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleGenerateReceipt(tx.id)}>
                                                    <Printer className="mr-2 h-4 w-4" /> Generate Receipt
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <ArrowUpRight className="mr-2 h-4 w-4" /> View Details
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
