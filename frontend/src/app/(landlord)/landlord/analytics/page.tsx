"use client";

import * as React from 'react';
import { useState } from 'react';
import {
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/features/analytics';
import type { AnalyticsPeriod } from '@/features/analytics/types/types';

// Helper for currency formatting
const formatCurrency = (value: number) => {
  if (value >= 1000000) return `KES ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `KES ${(value / 1000).toFixed(0)}K`;
  return `KES ${value.toLocaleString()}`;
};

// Custom tooltip component - theme adaptive
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-4 border border-border rounded-lg shadow-lg">
        <p className="text-sm font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-muted-foreground">
            <span className="font-semibold capitalize">{entry.name}:</span>{' '}
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
  } as any;

  // Calculate real values
  const avgOccupancy = data.propertyPerformance?.length > 0
    ? Math.round(data.propertyPerformance.reduce((sum: number, p: any) => sum + (p.occupancy || 0), 0) / data.propertyPerformance.length)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BarChart3 className="h-7 w-7 md:h-8 md:w-8 text-primary" />
            Business Analytics
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            See how your properties are performing
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as AnalyticsPeriod)}>
            <SelectTrigger className="w-[180px] h-12 text-base font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d" className="text-base">Last 30 Days</SelectItem>
              <SelectItem value="90d" className="text-base">Last 3 Months</SelectItem>
              <SelectItem value="180d" className="text-base">Last 6 Months</SelectItem>
              <SelectItem value="1y" className="text-base">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 font-bold">
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics - Large readable cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { 
            label: 'Avg Occupancy', 
            value: `${avgOccupancy}%`,
            change: `${data.revenueGrowth?.percentage > 0 ? '+' : ''}${data.revenueGrowth?.percentage || 0}%`,
            icon: TrendingUp, 
          },
          { 
            label: 'Total Revenue', 
            value: formatCurrency(data.totalRevenue || 0), 
            change: `${data.revenueGrowth?.percentage > 0 ? '+' : ''}${data.revenueGrowth?.percentage || 0}%`,
            icon: DollarSign, 
          },
          { 
            label: 'Active Tenants', 
            value: (data.activeUsers || 0).toString(), 
            change: `${data.userGrowth?.percentage > 0 ? '+' : ''}${data.userGrowth?.percentage || 0}%`,
            icon: Users, 
          },
          { 
            label: 'Total Properties', 
            value: (data.totalHostels || 0).toString(), 
            change: 'Your hostels',
            icon: Building2, 
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border shadow-sm bg-card">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-muted-foreground">{metric.label}</p>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{metric.value}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{metric.change} vs last period</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="overview" className="text-base font-medium">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="text-base font-medium">Performance</TabsTrigger>
          <TabsTrigger value="revenue" className="text-base font-medium">Revenue</TabsTrigger>
          <TabsTrigger value="trends" className="text-base font-medium">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Trends */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Portfolio Performance
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Occupancy and revenue trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] md:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trends}>
                      <defs>
                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                      <YAxis yAxisId="left" className="text-xs" tickFormatter={(value) => `${value}%`} tick={{ fill: 'currentColor' }} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        className="text-xs"
                        tickFormatter={(value) => `${(value / 1000)}K`}
                        tick={{ fill: 'currentColor' }}
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

            <Card className="border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <PieChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Revenue Distribution
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Monthly revenue breakdown by property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] md:h-[350px]">
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
                          background: 'var(--background)',
                          border: '1px solid var(--border)',
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
            <Card className="border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Activity className="h-5 w-5 text-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Multi-dimensional performance analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] md:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.platformMetrics}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="metric" className="text-xs" tick={{ fill: 'currentColor' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" tick={{ fill: 'currentColor' }} />
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
            <Card className="border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Hostel Comparison
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Performance comparison across properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] md:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.propertyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
                      <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
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
          <Card className="border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <DollarSign className="h-5 w-5 text-primary" />
                Revenue Analysis
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Detailed revenue trends and forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trends}>
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tickFormatter={(value) => `KES ${(value / 1000)}K`} tick={{ fill: 'currentColor' }} />
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
          <Card className="border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Booking Trends
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Booking patterns and growth analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
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
