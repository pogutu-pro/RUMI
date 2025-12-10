"use client";

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useHostels } from '@/hooks/use-hostels';
import { usePaymentStats } from '@/hooks/use-payments';

// Mock data - replace with API calls
const monthlyRevenueData = [
  { month: 'Jul', revenue: 845000, occupancy: 87 },
  { month: 'Aug', revenue: 920000, occupancy: 92 },
  { month: 'Sep', revenue: 880000, occupancy: 89 },
  { month: 'Oct', revenue: 1050000, occupancy: 95 },
  { month: 'Nov', revenue: 1150000, occupancy: 97 },
  { month: 'Dec', revenue: 1280000, occupancy: 98 },
];

const hostelPerformanceData = [
  { name: 'Parklands Heights', occupancy: 98, revenue: 420000, trend: '+12%' },
  { name: 'Westlands Plaza', occupancy: 95, revenue: 380000, trend: '+8%' },
  { name: 'Kilimani Suites', occupancy: 92, revenue: 320000, trend: '+5%' },
  { name: 'CBD Central', occupancy: 88, revenue: 280000, trend: '+3%' },
  { name: 'South B Residence', occupancy: 75, revenue: 180000, trend: '-2%' },
];

const bookingStatusData = [
  { name: 'Confirmed', value: 142, color: '#10b981' },
  { name: 'Pending', value: 28, color: '#f59e0b' },
  { name: 'Cancelled', value: 12, color: '#ef4444' },
];

const recentActivities = [
  {
    id: 1,
    type: 'booking',
    title: 'New booking confirmed',
    description: 'Sarah Kimani - Parklands Heights, Room 204',
    time: '5 minutes ago',
    icon: CheckCircle2,
    color: 'text-green-600',
  },
  {
    id: 2,
    type: 'payment',
    title: 'Payment received',
    description: 'KES 45,000 from Michael Odhiambo',
    time: '1 hour ago',
    icon: DollarSign,
    color: 'text-blue-600',
  },
  {
    id: 3,
    type: 'alert',
    title: 'Maintenance required',
    description: 'Water heater issue - Kilimani Suites, Room 12',
    time: '3 hours ago',
    icon: AlertCircle,
    color: 'text-orange-600',
  },
  {
    id: 4,
    type: 'cancellation',
    title: 'Booking cancelled',
    description: 'Jane Mwangi - Requested refund',
    time: '5 hours ago',
    icon: XCircle,
    color: 'text-red-600',
  },
];

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  trend: 'up' | 'down';
  description?: string;
  loading?: boolean;
}

function KPICard({ title, value, change, icon: Icon, trend, description, loading }: KPICardProps) {
  if (loading) {
    return (
      <Card className="border-none shadow-lg bg-card">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-lg bg-card hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-1">
            {value}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={trend === 'up' ? 'default' : 'destructive'}
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold',
                trend === 'up'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              )}
            >
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </Badge>
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        </CardContent>
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Card>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-muted-foreground">
            <span className="font-medium">{entry.name}:</span>{' '}
            {entry.name.includes('Revenue')
              ? `KES ${entry.value.toLocaleString()}`
              : `${entry.value}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LandlordDashboard() {
  const { user } = useAuth();
  const { data: hostelsData, isLoading: hostelsLoading } = useHostels();
  const { data: paymentStats, isLoading: statsLoading } = usePaymentStats();

  const loading = hostelsLoading || statsLoading;

  const hostels = hostelsData?.results || [];
  const activeHostelsCount = hostels.length; // Or filter by status 'active'
  
  const totalRooms = hostels.reduce((sum, h) => sum + h.total_rooms, 0);
  const totalOccupied = hostels.reduce((sum, h) => sum + (h.total_rooms - h.available_rooms), 0);
  const occupancyRate = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;
  
  const totalRevenue = paymentStats?.totalRevenue || 0;
  
  // Pending actions could be unread messages + pending bookings + support tickets
  // For now, hardcode or fetch if possible. Keeping as 12 for demo or 0.
  const pendingActions = 0; // TODO: Implement pending actions aggregation

  const displayName = React.useMemo(() => {
    if (!user) return 'Landlord';
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return user.email.split('@')[0];
  }, [user]);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-4 md:space-y-8 pb-8 animate-in fade-in duration-500">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col gap-2 md:gap-4">
        <div>
          {/* Hide full date on mobile, show "Today" instead */}
          <p className="text-xs md:text-sm font-medium text-muted-foreground">
            <span className="md:hidden">Today</span>
            <span className="hidden md:inline">{currentDate}</span>
          </p>
          {/* Smaller heading on mobile */}
          <h1 className="text-xl md:text-3xl font-bold tracking-tight mt-1">
            Welcome back, {displayName.split(' ')[0]}
          </h1>
          {/* Hide description on mobile */}
          <p className="text-muted-foreground mt-1 text-sm hidden md:block">
            Here&apos;s what&apos;s happening with your portfolio today.
          </p>
        </div>
        {/* Action Buttons - Stack on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:hidden">
          <Button variant="outline" size="sm" className="gap-2 justify-center">
            <Calendar className="h-4 w-4" />
            Last 30 days
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 justify-center">
            <Activity className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden md:flex items-center gap-3 justify-end -mt-12">
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Last 30 days
        </Button>
        <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
          <Activity className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Hostels"
          value={loading ? '...' : activeHostelsCount.toString()}
          change={0} // TODO: Calculate change
          trend="up"
          icon={Building2}
          description="properties managed"
          loading={loading}
        />
        <KPICard
          title="Occupancy Rate"
          value={loading ? '...' : `${occupancyRate}%`}
          change={0}
          trend="up"
          icon={TrendingUp}
          description={`${totalRooms} total rooms`}
          loading={loading}
        />
        <KPICard
          title="Monthly Revenue"
          value={loading ? '...' : `KES ${(totalRevenue / 1000).toFixed(1)}K`}
          change={0}
          trend="up"
          icon={DollarSign}
          description="total revenue"
          loading={loading}
        />
        <KPICard
          title="Pending Actions"
          value={loading ? '...' : pendingActions.toString()}
          change={0}
          trend="down"
          icon={Clock}
          description="requires attention"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue & Occupancy Trend */}
        <Card className="lg:col-span-2 border-none shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Revenue & Occupancy Trends
            </CardTitle>
            <CardDescription>Monthly performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="left"
                    className="text-xs text-muted-foreground"
                    tickFormatter={(value) => `${(value / 1000)}K`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-xs text-muted-foreground"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue (KES)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Occupancy Rate (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card className="border-none shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-emerald-600" />
              Booking Status
            </CardTitle>
            <CardDescription>Current booking distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {bookingStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hostel Performance & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Hostels */}
        <Card className="border-none shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Hostel Performance
            </CardTitle>
            <CardDescription>Ranked by occupancy and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hostelPerformanceData.map((hostel, index) => (
                <div
                  key={hostel.name}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-950 dark:to-cyan-950 font-bold text-emerald-700 dark:text-emerald-400">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {hostel.name}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {hostel.occupancy}% occupied
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs px-1.5 py-0',
                          hostel.trend.startsWith('+')
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        )}
                      >
                        {hostel.trend}
                      </Badge>
                    </div>
                    <Progress value={hostel.occupancy} className="mt-2 h-1.5" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      KES {(hostel.revenue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="border-none shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-emerald-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates across your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className={cn('p-2 rounded-lg bg-muted', activity.color)}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-emerald-100">
            Common tasks to manage your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="secondary" className="justify-start gap-2 h-auto py-3">
              <Building2 className="h-4 w-4" />
              <div className="text-left">
                <p className="font-semibold">Add Hostel</p>
                <p className="text-xs opacity-80">Register new property</p>
              </div>
            </Button>
            <Button variant="secondary" className="justify-start gap-2 h-auto py-3">
              <Users className="h-4 w-4" />
              <div className="text-left">
                <p className="font-semibold">View Tenants</p>
                <p className="text-xs opacity-80">Manage all tenants</p>
              </div>
            </Button>
            <Button variant="secondary" className="justify-start gap-2 h-auto py-3">
              <DollarSign className="h-4 w-4" />
              <div className="text-left">
                <p className="font-semibold">Payments</p>
                <p className="text-xs opacity-80">Track transactions</p>
              </div>
            </Button>
            <Button variant="secondary" className="justify-start gap-2 h-auto py-3">
              <TrendingUp className="h-4 w-4" />
              <div className="text-left">
                <p className="font-semibold">Analytics</p>
                <p className="text-xs opacity-80">View detailed reports</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
