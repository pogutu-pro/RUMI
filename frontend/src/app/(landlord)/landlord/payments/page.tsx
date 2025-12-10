"use client";

import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const paymentData = [
  { month: 'Jul', collected: 1200000, pending: 180000, completed: 94 },
  { month: 'Aug', collected: 1350000, pending: 150000, completed: 96 },
  { month: 'Sep', collected: 1280000, pending: 220000, completed: 92 },
  { month: 'Oct', collected: 1580000, pending: 140000, completed: 97 },
  { month: 'Nov', collected: 1680000, pending: 120000, completed: 98 },
  { month: 'Dec', collected: 1850000, pending: 95000, completed: 99 },
];

const recentTransactions = [
  {
    id: 'TXN-001',
    student: 'Sarah Kimani',
    hostel: 'Parklands Heights',
    amount: 45000,
    status: 'completed',
    date: '2024-12-01T10:30:00',
    method: 'M-Pesa',
  },
  {
    id: 'TXN-002',
    student: 'Michael Odhiambo',
    hostel: 'Westlands Plaza',
    amount: 42000,
    status: 'completed',
    date: '2024-12-01T09:15:00',
    method: 'Bank Transfer',
  },
  {
    id: 'TXN-003',
    student: 'Jane Mwangi',
    hostel: 'Kilimani Suites',
    amount: 38000,
    status: 'pending',
    date: '2024-12-01T08:45:00',
    method: 'M-Pesa',
  },
  {
    id: 'TXN-004',
    student: 'Peter Njoroge',
    hostel: 'CBD Central',
    amount: 40000,
    status: 'completed',
    date: '2024-11-30T16:20:00',
    method: 'Card',
  },
  {
    id: 'TXN-005',
    student: 'Mary Waithera',
    hostel: 'South B Residence',
    amount: 35000,
    status: 'failed',
    date: '2024-11-30T14:10:00',
    method: 'M-Pesa',
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover p-4 border border-border rounded-lg shadow-xl">
        <p className="text-sm font-semibold text-popover-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-muted-foreground">
            <span className="font-medium capitalize">{entry.name}:</span>{' '}
            KES {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PaymentsPage() {
  const [timeRange, setTimeRange] = useState('6months');

  const totalCollected = paymentData.reduce((sum, item) => sum + item.collected, 0);
  const avgCollectionRate = (paymentData.reduce((sum, item) => sum + item.completed, 0) / paymentData.length).toFixed(1);
  const pendingPayments = paymentData[paymentData.length - 1].pending;
  const completedTransactions = recentTransactions.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Payments & Finance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track payments, manage payouts, and view financial analytics
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                KES {(totalCollected / 1000000).toFixed(2)}M
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 flex items-center gap-1 px-2 py-0.5 border-0">
                  <ArrowUpRight className="h-3 w-3" />
                  12.5%
                </Badge>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                KES {(pendingPayments / 1000).toFixed(0)}K
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Badge className="bg-orange-500/10 text-orange-600 flex items-center gap-1 px-2 py-0.5 border-0">
                  <ArrowDownRight className="h-3 w-3" />
                  8.2%
                </Badge>
                <span className="text-xs text-muted-foreground">decrease</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">{avgCollectionRate}%</p>
              <div className="flex items-center gap-1 mt-2">
                <Badge className="bg-blue-500/10 text-blue-600 flex items-center gap-1 px-2 py-0.5 border-0">
                  <ArrowUpRight className="h-3 w-3" />
                  2.1%
                </Badge>
                <span className="text-xs text-muted-foreground">improvement</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <CreditCard className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">{completedTransactions}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-muted-foreground">completed today</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Trends */}
        <Card className="border-none shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Payment Collection Trends
            </CardTitle>
            <CardDescription>Monthly payment collection vs pending amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paymentData}>
                  <defs>
                    <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#collected)"
                    name="Collected"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#pending)"
                    name="Pending"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card className="border-none shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Collection Rate Performance
            </CardTitle>
            <CardDescription>Percentage of successful collections per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" domain={[90, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Collection Rate']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-none shadow-lg bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Latest payment activities across all properties</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    'p-3 rounded-lg',
                    transaction.status === 'completed' ? 'bg-green-100 dark:bg-green-950/30' :
                    transaction.status === 'pending' ? 'bg-orange-100 dark:bg-orange-950/30' :
                    'bg-red-100 dark:bg-red-950/30'
                  )}>
                    {transaction.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : transaction.status === 'pending' ? (
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{transaction.student}</p>
                    <p className="text-xs text-muted-foreground">{transaction.hostel} • {transaction.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    KES {transaction.amount.toLocaleString()}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs px-2 py-0.5',
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                      transaction.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' :
                      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                    )}
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
