"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MousePointerClick
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAnalytics, useAnalyticsBreakdown } from "@/features/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export default function Page() {
  const { data: analytics, isLoading } = useAnalytics('30d');
  const { data: userStats } = useAnalyticsBreakdown('users', '30d');
  const { data: revenueStats } = useAnalyticsBreakdown('revenue', '30d');
  const { data: bookingStats } = useAnalyticsBreakdown('bookings', '30d');

  const resolvedColors = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        primary: '#10b981',
        primarySoft: 'rgba(16, 185, 129, 0.1)',
        chart1: '#3b82f6',
        chart1Soft: 'rgba(59, 130, 246, 0.1)',
        chart2: '#10b981',
        chart2Soft: 'rgba(16, 185, 129, 0.1)',
        chart3: '#8b5cf6',
      };
    }

    const styles = getComputedStyle(document.documentElement);
    const chart1Raw = styles.getPropertyValue('--chart-1').trim();
    const chart2Raw = styles.getPropertyValue('--chart-2').trim();
    const chart3Raw = styles.getPropertyValue('--chart-3').trim();
    const primaryRaw = styles.getPropertyValue('--primary').trim();

    const hslFromRaw = (raw: string) => (raw ? `hsl(${raw})` : undefined);

    const chart1 = hslFromRaw(chart1Raw) ?? '#3b82f6';
    const chart2 = hslFromRaw(chart2Raw) ?? '#10b981';
    const chart3 = hslFromRaw(chart3Raw) ?? '#8b5cf6';
    const primary = hslFromRaw(primaryRaw) ?? '#10b981';

    const soft = (color: string, alpha: number) => {
      if (color.startsWith('hsl(')) {
        return color.replace('hsl(', `hsl(`).replace(')', ` / ${alpha})`);
      }
      // Fallback for hex colors
      return color;
    };

    return {
      primary,
      primarySoft: soft(primary, 0.1),
      chart1,
      chart1Soft: soft(chart1, 0.1),
      chart2,
      chart2Soft: soft(chart2, 0.1),
      chart3,
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: resolvedColors.primarySoft,
        titleColor: resolvedColors.primary,
        bodyColor: resolvedColors.primary,
        borderColor: resolvedColors.chart1Soft,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.3)', drawBorder: false },
        ticks: { color: 'rgba(148, 163, 184, 0.9)', font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(148, 163, 184, 0.9)', font: { size: 11 } },
      },
    },
  };

  const trafficData = useMemo(() => {
     const labels = userStats?.map((d: any) => d.label) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
     const data = userStats?.map((d: any) => d.value) || [65, 59, 80, 81, 56, 55, 40];
    
     return {
      labels,
      datasets: [
        {
          label: "Active Users",
          data,
          borderColor: resolvedColors.chart1,
          backgroundColor: resolvedColors.chart1Soft,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: resolvedColors.chart1,
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [userStats, resolvedColors]);

  const deviceData = useMemo(() => ({
    labels: ["Mobile", "Desktop", "Tablet"],
    datasets: [
      {
        data: [65, 30, 5],
        backgroundColor: [
          resolvedColors.chart1,
          resolvedColors.chart2,
          resolvedColors.chart3,
        ],
        borderWidth: 0,
      },
    ],
  }), [resolvedColors]);

  const conversionData = useMemo(() => {
    const labels = bookingStats?.map((d: any) => d.label) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = bookingStats?.map((d: any) => d.value) || [12, 19, 3, 5, 2, 3, 9];

    return {
        labels,
        datasets: [
        {
            label: "Bookings",
            data,
            backgroundColor: resolvedColors.chart2,
            borderRadius: 4,
            hoverBackgroundColor: resolvedColors.chart2Soft,
        },
        ],
    };
  }, [bookingStats, resolvedColors]);

  if (isLoading) {
      return (
          <div className="space-y-6">
              <div className="flex justify-between">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-10 w-32" />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                  <Skeleton className="h-96 w-full lg:col-span-2 rounded-xl" />
                  <Skeleton className="h-96 w-full rounded-xl" />
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics Overview</h1>
          <p className="mt-1 text-muted-foreground">Detailed insights into platform usage and performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                    {analytics?.totalUsers?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
             <div className="flex items-center mt-4">
               {(analytics?.userGrowth?.percentage || 0) >= 0 ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {analytics?.userGrowth?.percentage}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 flex items-center bg-red-50 px-2 py-0.5 rounded-full dark:bg-red-900/20 dark:text-red-400">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  {Math.abs(analytics?.userGrowth?.percentage || 0)}%
                </span>
              )}
               <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">{analytics?.activeUsers?.toLocaleString() || '0'}</h3>
              </div>
              <div className="p-3 bg-sky-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
            <div className="flex items-center mt-4">
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +5.2%
                </span>
                <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                    KES {(analytics?.totalRevenue || 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                 <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center mt-4">
               {(analytics?.revenueGrowth?.percentage || 0) >= 0 ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {analytics?.revenueGrowth?.percentage}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 flex items-center bg-red-50 px-2 py-0.5 rounded-full dark:bg-red-900/20 dark:text-red-400">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  {Math.abs(analytics?.revenueGrowth?.percentage || 0)}%
                </span>
              )}
               <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">3.2%</h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <MousePointerClick className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex items-center mt-4">
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +0.8%
                </span>
                <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">User Activity Trend</CardTitle>
            <CardDescription>Daily active users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <Line data={trafficData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Device Usage</CardTitle>
            <CardDescription>Traffic sources by device</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[350px]">
            <div className="w-[220px] h-[220px] relative">
              <Doughnut 
                data={deviceData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } 
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Booking Conversions</CardTitle>
          <CardDescription>Weekly booking numbers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <Bar data={conversionData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
