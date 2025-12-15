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
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { 
  TrendingUp,
  Users,
  DollarSign,
  Home,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Wrench,
  Settings,
  ShieldCheck,
  FileCheck
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useAnalyticsBreakdown, useAdminActivityFeed } from "@/features/analytics";
import { cn } from "@/lib/utils/cn";
import { formatDistanceToNow } from "date-fns";

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

const getActivityIconAndColor = (type: string) => {
  switch (type) {
    case 'booking':
      return { icon: <Home className="w-4 h-4 text-primary" />, color: "bg-primary/10" };
    case 'payment':
      return { icon: <DollarSign className="w-4 h-4 text-emerald-600" />, color: "bg-emerald-500/10" };
    case 'user_registration':
      return { icon: <Users className="w-4 h-4 text-blue-600" />, color: "bg-blue-500/10" };
    case 'verification_request':
      return { icon: <ShieldCheck className="w-4 h-4 text-amber-600" />, color: "bg-amber-500/10" };
    case 'maintenance':
      return { icon: <Wrench className="w-4 h-4 text-orange-600" />, color: "bg-orange-500/10" };
    case 'system':
      return { icon: <Settings className="w-4 h-4 text-gray-600" />, color: "bg-gray-500/10" };
    default:
      return { icon: <Activity className="w-4 h-4 text-primary" />, color: "bg-primary/10" };
  }
};

export default function Page() {
  const { data: analytics, isLoading } = useAnalytics('30d');
  const { data: userStats } = useAnalyticsBreakdown('users', '30d');
  const { data: revenueStats } = useAnalyticsBreakdown('revenue', '30d');
  const { data: activityFeed, isLoading: activityLoading, error: activityError } = useAdminActivityFeed(5);

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
      chart3Soft: soft(chart3, 0.1),
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
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
        grid: {
          color: 'rgba(148, 163, 184, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const userGrowthData = useMemo(() => {
    // Fallback if no real breakdown data is returned yet
    // In production, userStats should be an array of { date: string, count: number }
    const labels = userStats?.map((d: any) => d.label) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = userStats?.map((d: any) => d.value) || [12, 19, 15, 25, 22, 30, 35];

    return {
      labels,
      datasets: [
        {
          label: "New Users",
          data,
          borderColor: resolvedColors.primary,
          backgroundColor: resolvedColors.primarySoft,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: resolvedColors.primary,
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [userStats, resolvedColors]);

  const revenueData = useMemo(() => {
    const labels = revenueStats?.map((d: any) => d.label) || ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const data = revenueStats?.map((d: any) => d.value) || [15000, 22000, 18000, 24000];

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data,
          backgroundColor: resolvedColors.chart2,
          borderRadius: 4,
          hoverBackgroundColor: resolvedColors.chart2Soft,
        },
      ],
    };
  }, [revenueStats, resolvedColors]);

  const distributionData = useMemo(() => ({
    labels: ["Students", "Landlords", "Caretakers"],
    datasets: [
      {
        data: [70, 20, 10], // Placeholder distribution until breakdown supports it
        backgroundColor: [
          resolvedColors.chart1,
          resolvedColors.chart2,
          resolvedColors.chart3,
        ],
        borderWidth: 0,
      },
    ],
  }), [resolvedColors]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back, here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button className="gap-2">
            <TrendingUp className="h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  KES {analytics?.totalRevenue?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-primary" />
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
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  {analytics?.totalUsers?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                <p className="text-sm font-medium text-muted-foreground">Active Hostels</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  {analytics?.totalHostels?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Home className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                 <ArrowUpRight className="w-3 h-3 mr-1" />
                 +2 new
              </span>
              <span className="text-xs text-muted-foreground ml-2">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bookings</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  {analytics?.totalBookings?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex items-center mt-4">
               {(analytics?.bookingGrowth?.percentage || 0) >= 0 ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {analytics?.bookingGrowth?.percentage}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 flex items-center bg-red-50 px-2 py-0.5 rounded-full dark:bg-red-900/20 dark:text-red-400">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  {Math.abs(analytics?.bookingGrowth?.percentage || 0)}%
                </span>
              )}
               <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Layer */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Download PNG</DropdownMenuItem>
                  <DropdownMenuItem>View Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <Line data={userGrowthData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
            <CardDescription>Income breakdown by week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar data={revenueData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="border-border/50 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">User Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="w-[220px] h-[220px] relative">
              <Doughnut 
                data={distributionData} 
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

        <Card className="border-border/50 shadow-sm lg:col-span-2">
          <CardHeader>
             <div className="flex items-center justify-between">
               <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
               <Button variant="ghost" size="sm" className="text-muted-foreground">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activityLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                       <Skeleton className="h-4 w-3/4" />
                       <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : activityError ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Failed to load activity feed.
                </div>
              ) : activityFeed?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No recent activity.
                </div>
              ) : (
                activityFeed?.map((item) => {
                  const { icon, color } = getActivityIconAndColor(item.type);
                  return (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className={cn("mt-1 p-2 rounded-full", color)}>
                        {icon}
                      </div>
                      <div className="flex-1 space-y-1">
                         <p className="text-sm font-medium text-foreground">{item.title}</p>
                         <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
