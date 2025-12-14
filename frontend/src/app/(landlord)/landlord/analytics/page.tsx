"use client";

import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalytics } from '@/features/analytics';
import type { AnalyticsPeriod } from '@/features/analytics/types/types';

// Helper for currency formatting
const formatCurrency = (value: number) => {
  if (value >= 1000000) return `KES ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `KES ${(value / 1000).toFixed(0)}K`;
  return `KES ${value.toLocaleString()}`;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium capitalize">{entry.name}:</span>{' '}
            {entry.name.includes('Revenue') || entry.name.includes('revenue')
              ? `KES ${entry.value.toLocaleString()}`
              : entry.name.includes('Occupancy') || entry.name.includes('occupancy')
              ? `${entry.value}%`
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};



export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<AnalyticsPeriod>('180d');
  const { data: analytics, isLoading } = useAnalytics(timeRange);
  
  // Default empty data if undefined to prevent crashes
  const data = analytics || {
    trends: [],
    propertyPerformance: [],
    platformMetrics: [],
    revenueDistribution: [],
    totalRevenue: 0,
    activeUsers: 0,
    totalHostels: 0,
    userGrowth: { percentage: 0 } as any,
    revenueGrowth: { percentage: 0 } as any,
    bookingGrowth: { percentage: 0 } as any,
    // others...
  } as any; // Cast as any to avoid partial matches on init

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Business Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Comprehensive insights into your portfolio performance
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as AnalyticsPeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
              <SelectItem value="180d">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
            <Download className="h-4 w-4" />
            Export Analytics
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { 
            label: 'Avg Occupancy', 
            value: '94%', // Ideally from API
            change: '+3%', 
            icon: TrendingUp, 
            color: 'emerald' 
          },
          { 
            label: 'Total Revenue', 
            value: formatCurrency(data.totalRevenue ?? 0), 
            change: `${data.revenueGrowth?.percentage > 0 ? '+' : ''}${data.revenueGrowth?.percentage ?? 0}%`,
            icon: DollarSign, 
            color: 'blue' 
          },
          { 
            label: 'Active Tenants', 
            value: (data.activeUsers ?? 0).toString(), 
            change: `${data.userGrowth?.percentage > 0 ? '+' : ''}${data.userGrowth?.percentage ?? 0}%`,
            icon: Users, 
            color: 'purple' 
          },
          { 
            label: 'Properties', 
            value: (data.totalHostels ?? 0).toString(), 
            change: '+0', // Hostels grow slowly, can mock change or get from API
            icon: Building2, 
            color: 'orange' 
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`border-none shadow-lg bg-gradient-to-br from-${metric.color}-50 to-${metric.color}-100/50 dark:from-${metric.color}-950/30 dark:to-${metric.color}-900/20`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{metric.label}</p>
                  <metric.icon className={`h-5 w-5 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{metric.change} vs last period</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Trends */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Portfolio Performance
                </CardTitle>
                <CardDescription>Occupancy and revenue trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trends}>
                      <defs>
                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" tickFormatter={(value) => `${value}%`} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        className="text-xs"
                        tickFormatter={(value) => `${(value / 1000)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="occupancy"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorOccupancy)"
                        name="Occupancy (%)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        name="Revenue (KES)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  Revenue Distribution
                </CardTitle>
                <CardDescription>Monthly revenue breakdown by property</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.revenueDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.revenueDistribution?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `KES ${value.toLocaleString()}`}
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radar Chart */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Multi-dimensional performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.platformMetrics}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="metric" className="text-xs" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart Comparison */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Hostel Comparison
                </CardTitle>
                <CardDescription>Performance comparison across properties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.propertyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="occupancy" fill="#10b981" name="Occupancy (%)" />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (K)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Revenue Analysis
              </CardTitle>
              <CardDescription>Detailed revenue trends and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trends}>
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `KES ${(value / 1000)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#revenue)"
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Booking Trends
              </CardTitle>
              <CardDescription>Booking patterns and growth analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Total Bookings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
