'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  usePayments, 
  usePaymentStats, 
  MpesaConfigModal 
} from '@/features/payments';
import { 
  useLandlordTransactions, 
  useLandlordPayouts 
} from '@/features/payments/hooks/use-payments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings2,
  Calendar,
  Wallet,
  ArrowUpRight,
  MoreVertical,
  Plus,
  ArrowDownLeft,
  ChevronRight,
  DollarSign,
  History,
  Activity,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LandlordPaymentsPage() {
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);
  const { data: stats, isLoading: isStatsLoading } = usePaymentStats();
  const { data: transactions, isLoading: isTransactionsLoading } = useLandlordTransactions();
  const { data: payouts, isLoading: isPayoutsLoading } = useLandlordPayouts();

  // Enhanced Mock Data for Visuals
  const chartData = [
    { name: 'Mon', amount: 45000 },
    { name: 'Tue', amount: 52000 },
    { name: 'Wed', amount: 48000 },
    { name: 'Thu', amount: 61000 },
    { name: 'Fri', amount: 55000 },
    { name: 'Sat', amount: 67000 },
    { name: 'Sun', amount: 72000 },
  ];

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
      <MpesaConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
      />

      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/5 border-emerald-500/20 mb-2">
            Property Performance
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Financial Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl">
            Track your rental income, monitor collection rates, and manage M-Pesa automated settlements.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline"
            className="rounded-xl h-11 px-5 border-slate-200 dark:border-slate-800 font-bold bg-card"
            onClick={() => setIsConfigModalOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-2 text-emerald-600" />
            M-Pesa Config
          </Button>
          <Button 
            className="rounded-xl h-11 px-5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/10 font-bold"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </motion.div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Revenue', 
            value: `KES ${stats?.totalRevenue?.toLocaleString() || '1.2M'}`, 
            trend: '+12.5%', 
            isUp: true, 
            icon: DollarSign,
            color: 'text-emerald-600'
          },
          { 
            label: 'Net Balance', 
            value: `KES ${stats?.availableBalance?.toLocaleString() || '450K'}`, 
            trend: 'In payouts', 
            isUp: true, 
            icon: Wallet,
            color: 'text-blue-600'
          },
          { 
            label: 'Pending Receipts', 
            value: `KES ${stats?.pendingAmount?.toLocaleString() || '85K'}`, 
            trend: '24h window', 
            isUp: false, 
            icon: Clock,
            color: 'text-amber-600'
          },
          { 
            label: 'Failed Invoices', 
            value: stats?.failedCount?.toString() || '3', 
            trend: '-2% week', 
            isUp: false, 
            icon: TrendingDown,
            color: 'text-red-600'
          },
        ].map((kpi, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="border-slate-200 dark:border-slate-800 bg-card shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 transition-transform group-hover:scale-110", kpi.color)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                    kpi.isUp ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-slate-500 bg-slate-50 dark:bg-slate-500/10"
                  )}>
                    {kpi.isUp && <TrendingUp className="h-3 w-3" />}
                    {kpi.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-8">
          <Card className="border-slate-200 dark:border-slate-800 bg-card shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>Visualizing performance for all assets</CardDescription>
              </div>
              <Select defaultValue="7d">
                <SelectTrigger className="w-28 h-9 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7d</SelectItem>
                  <SelectItem value="30d">Last 30d</SelectItem>
                  <SelectItem value="90d">Last 90d</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmountLandlord" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        backgroundColor: '#0f172a',
                        color: '#fff'
                      }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAmountLandlord)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          {/* Quick Withdraw Card */}
          <Card className="border-none bg-slate-900 dark:bg-emerald-950/30 text-white shadow-xl rounded-3xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 blur-3xl rounded-full group-hover:scale-110 transition-transform" />
            <CardContent className="p-8 relative z-10 flex flex-col h-full">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-emerald-300 font-black uppercase tracking-[0.2em] text-[10px]">Instant Payout</p>
                <h3 className="text-3xl font-black">Withdraw</h3>
                <p className="text-white/50 text-xs leading-relaxed max-w-[200px]">
                  Funds are settled instantly to your verified M-Pesa business account.
                </p>
              </div>
              <Button className="w-full h-12 mt-8 bg-emerald-500 text-white hover:bg-emerald-400 rounded-xl font-black shadow-lg shadow-emerald-500/20 group/btn">
                Initiate Transfer
                <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border-slate-200 dark:border-slate-800 bg-card shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                <span>Recent Payouts</span>
                <History className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1">
                {[1, 2].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl transition-all cursor-pointer group">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
                      <ArrowDownLeft className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">KES 12,500.00</p>
                      <p className="text-[10px] text-slate-500">M-Pesa • Dec {18 - i}</p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-emerald-500 opacity-50" />
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-2 text-xs font-bold text-slate-500 hover:text-emerald-600 rounded-xl" asChild>
                <Link href="/landlord/payments/payouts">View Summary</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transactions Vault */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200 dark:border-slate-800 bg-card shadow-sm rounded-3xl overflow-hidden">
          <Tabs defaultValue="transactions" className="w-full">
            <CardHeader className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 dark:border-slate-800">
              <div className="space-y-4">
                <CardTitle className="text-2xl font-black">Transaction Vault</CardTitle>
                <TabsList className="bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl h-10 border border-slate-200 dark:border-slate-800">
                  <TabsTrigger value="transactions" className="rounded-lg px-6 font-bold text-xs h-8">Incoming</TabsTrigger>
                  <TabsTrigger value="payouts" className="rounded-lg px-6 font-bold text-xs h-8">Payouts</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 rounded-lg px-4 border-slate-200 dark:border-slate-800 bg-card font-bold text-xs">
                  <Filter className="h-3.5 w-3.5 mr-2" /> Filter
                </Button>
                <Button variant="outline" size="sm" className="h-9 rounded-lg px-4 border-slate-200 dark:border-slate-800 bg-card font-bold text-xs">
                  <Calendar className="h-3.5 w-3.5 mr-2" /> Dec 2025
                </Button>
              </div>
            </CardHeader>
            
            <TabsContent value="transactions" className="m-0">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ID / Ref</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Payer</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date/Time</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions && transactions.length > 0 ? (
                      transactions.slice(0, 5).map((tx: any, idx) => (
                        <tr key={tx.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                           <td className="px-8 py-5">
                            <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
                              {tx.reference || 'TXN12345678'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 uppercase">
                                {tx.student_name?.[0] || 'U'}
                              </div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                                {tx.student_name || 'Anonymous'}
                                <span className="block text-[10px] font-normal text-slate-500 uppercase tracking-tighter">{tx.hostel_name || 'Property Unit'}</span>
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(tx.date || Date.now()).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase">{tx.method || 'M-PESA'}</p>
                          </td>
                          <td className="px-8 py-5">
                            <p className="font-black text-slate-900 dark:text-white text-sm">KES {tx.amount?.toLocaleString() || '15,000'}</p>
                          </td>
                          <td className="px-8 py-5">
                            <Badge 
                              className={cn(
                                "text-[9px] h-5 px-2 rounded-md font-black uppercase",
                                tx.status === 'completed' && "bg-emerald-500/10 text-emerald-600",
                                tx.status === 'pending' && "bg-amber-500/10 text-amber-600",
                                tx.status === 'failed' && "bg-red-500/10 text-red-600"
                              )}
                            >
                              {tx.status || 'completed'}
                            </Badge>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                <ArrowRight className="h-4 w-4" />
                             </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-16 text-center">
                          <p className="text-slate-400 text-sm font-bold">No records found for this period.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-50 dark:border-slate-800 text-center">
                <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" asChild>
                  <Link href="/landlord/payments/history">Load Full Archive</Link>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="payouts" className="m-0 p-20 text-center text-slate-400 font-bold text-sm">
              Vault archive for payouts is empty.
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </motion.div>
  );
}
