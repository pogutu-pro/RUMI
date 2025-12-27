"use client";

import Link from "next/link";
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
  Zap,
  Filter,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboardStats, useAdminActivityFeed } from "@/features/analytics/hooks/use-admin";
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
      return { icon: <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, color: "bg-emerald-500/10" };
    case 'user_registration':
      return { icon: <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />, color: "bg-blue-500/10" };
    case 'verification_request':
      return { icon: <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />, color: "bg-amber-500/10" };
    case 'maintenance':
      return { icon: <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />, color: "bg-orange-500/10" };
    case 'system':
      return { icon: <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />, color: "bg-gray-500/10" };
    default:
      return { icon: <Activity className="w-4 h-4 text-primary" />, color: "bg-primary/10" };
  }
};

export default function Page() {
  const { data: stats, isLoading } = useAdminDashboardStats('30d');
  const { data: activityFeed, isLoading: activityLoading, error: activityError } = useAdminActivityFeed(10);

  // Derive pending actions from existing data or use placeholders if API doesn't support yet
  // This aligns with Business Logic verification needs
  const pendingActions = useMemo(() => {
      // Logic: Use revenueDistribution 'Pending' value if available
      const pendingBookings = stats?.revenueDistribution?.find(d => d.name === 'Pending')?.value || 0;
      
      return [
          { 
            label: 'Pending Bookings', 
            count: pendingBookings, 
            href: '/admin/bookings?status=pending', 
            icon: Calendar,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
          },
          { 
            label: 'Hostel Verifications', 
            count: 0, // Placeholder as endpoint doesn't return this yet
            href: '/admin/hostels/pending', 
            icon: Home,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
          },
          { 
            label: 'Landlord Approvals', 
            count: 0, // Placeholder
            href: '/admin/users/landlords', 
            icon: ShieldCheck,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
          },
          {
            label: 'Open Disputes',
            count: 0, // Placeholder
            href: '/admin/payments/disputes',
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-50'
          }
      ];
  }, [stats]);

  const resolvedColors = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        primary: '#10b981',
        primarySoft: 'rgba(16, 185, 129, 0.1)',
        chart1: '#3b82f6',
        chart1Soft: 'rgba(59, 130, 246, 0.1)',
        chart2: '#f59e0b',
        chart2Soft: 'rgba(245, 158, 11, 0.1)',
        background: '#ffffff',
      };
    }

    const styles = getComputedStyle(document.documentElement);
    const primaryRaw = styles.getPropertyValue('--primary').trim();
    // Use fallbacks for chart colors if variables aren't defined
    const chart1Raw = styles.getPropertyValue('--chart-1').trim() || '221.2 83.2% 53.3%';
    const chart2Raw = styles.getPropertyValue('--chart-2').trim() || '142.1 76.2% 36.3%';
    const chart3Raw = styles.getPropertyValue('--chart-3').trim() || '120 100% 50%';

    const hslFromRaw = (raw: string) => {
        if (!raw) return '#000';
        return raw.startsWith('hsl') ? raw : `hsl(${raw})`;
    }

    const primary = hslFromRaw(primaryRaw);
    const chart1 = hslFromRaw(chart1Raw);
    const chart2 = hslFromRaw(chart2Raw);

    return {
      primary,
      primarySoft: primary.replace(')', ' / 0.1)'),
      chart1,
      chart1Soft: chart1.replace(')', ' / 0.1)'),
      chart2,
      chart2Soft: chart2.replace(')', ' / 0.1)'),
      grid: 'rgba(148, 163, 184, 0.1)',
      text: 'rgba(148, 163, 184, 0.9)',
    };
  }, []);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { size: 13, weight: 600 as const },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: resolvedColors.grid, drawBorder: false },
        ticks: { color: resolvedColors.text, font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: resolvedColors.text, font: { size: 11 } },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }), [resolvedColors]);

  const userGrowthData = useMemo(() => {
    const labels = stats?.trends?.map((d) => d.month) || [];
    const bookings = stats?.trends?.map((d) => d.bookings) || [];

    return {
      labels,
      datasets: [
        {
          label: "Bookings",
          data: bookings,
          borderColor: resolvedColors.chart1,
          backgroundColor: resolvedColors.chart1Soft,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: resolvedColors.chart1,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [stats, resolvedColors]);

  const revenueData = useMemo(() => {
    const labels = stats?.trends?.map((d) => d.month) || [];
    const data = stats?.trends?.map((d) => d.revenue) || [];

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: data,
          backgroundColor: resolvedColors.primary,
          borderRadius: 6,
          hoverBackgroundColor: resolvedColors.primary, 
        },
      ],
    };
  }, [stats, resolvedColors]);

  const distributionData = useMemo(() => ({
    labels: stats?.revenueDistribution?.map(d => d.name) || ["Confirmed", "Pending", "Cancelled"],
    datasets: [
      {
        data: stats?.revenueDistribution?.map(d => d.value) || [0, 0, 0],
        backgroundColor: [
          resolvedColors.primary,
          resolvedColors.chart1,
          '#ef4444', // Red for cancelled
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }), [stats, resolvedColors]);

  if (isLoading) {
    return (
      <div className="space-y-6 pt-6">
        <div className="flex flex-col gap-2">
           <Skeleton className="h-10 w-48" />
           <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Overview of platform performance and activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
           {/* Quick Actions for Business Logic */}
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2 h-10 px-6">
                    <Zap className="h-4 w-4" />
                    Quick Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Business Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <Link href="/admin/hostels/pending" passHref>
                        <DropdownMenuItem className="cursor-pointer">
                            <Home className="mr-2 h-4 w-4" />
                            <span>Verify Hostels</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/users/landlords" passHref>
                        <DropdownMenuItem className="cursor-pointer">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Approve Landlords</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/payments/disputes" passHref>
                        <DropdownMenuItem className="cursor-pointer">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            <span>Resolve Disputes</span>
                        </DropdownMenuItem>
                    </Link>
                  </DropdownMenuGroup>
              </DropdownMenuContent>
           </DropdownMenu>

            <Link href="/admin/reports">
                <Button variant="outline" className="gap-2 h-10 px-4">
                <TrendingUp className="h-4 w-4" />
                View Reports
                </Button>
            </Link>
        </div>
      </div>

      {/* KPI Cards (Clickable) */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Revenue",
            value: `KES ${stats?.totalRevenue?.toLocaleString() || '0'}`,
            growth: stats?.revenueGrowth?.percentage || 0,
            icon: DollarSign,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
            href: "/admin/payments"
          },
          {
            title: "Total Users",
            value: stats?.totalUsers?.toLocaleString() || '0',
            growth: stats?.userGrowth?.percentage || 0,
            icon: Users,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10",
             href: "/admin/users"
          },
          {
            title: "Verified Hostels",
            value: stats?.totalHostels?.toLocaleString() || '0',
            growth: 0, 
            label: "active properties",
            icon: Home,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
             href: "/admin/hostels"
          },
          {
            title: "Total Bookings",
            value: stats?.totalBookings?.toLocaleString() || '0',
            growth: stats?.bookingGrowth?.percentage || 0,
            icon: Activity,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-500/10",
            href: "/admin/bookings"
          },
        ].map((item, i) => (
          <Link href={item.href} key={i}>
            <Card className="border-border/60 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative cursor-pointer h-full">
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${item.color}`}>
                <item.icon className="w-24 h-24 -mt-4 -mr-4" />
                </div>
                <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl", item.bg)}>
                    <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    {item.growth !== undefined && (
                    <div className={cn(
                        "flex items-center px-2 py-1 rounded-full text-xs font-semibold ring-1 ring-inset",
                        item.growth >= 0 
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                        {item.growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(item.growth)}%
                    </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1 group-hover:scale-105 transition-transform origin-left">
                    {item.value}
                    </h3>
                </div>
                </CardContent>
            </Card>
          </Link>
        ))}
      </div>

       {/* Pending Actions (New Section) */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pendingActions.map((action, i) => (
              <Link href={action.href} key={i} className="group">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", action.bg)}>
                              <action.icon className={cn("h-4 w-4", action.color)} />
                          </div>
                          <span className="text-sm font-medium">{action.label}</span>
                      </div>
                      <span className="text-sm font-bold bg-muted px-2.5 py-0.5 rounded-full">{action.count}</span>
                  </div>
              </Link>
          ))}
       </div>

      {/* Main Charts Area */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Platform Activity</CardTitle>
                <CardDescription>Booking volume trends over time</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[350px] w-full p-2">
              <Line data={userGrowthData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <Bar data={revenueData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Distribution & Activity */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Booking Status</CardTitle>
            <CardDescription>Distribution of current bookings</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-8">
            <div className="w-[240px] h-[240px] relative">
              <Doughnut 
                data={distributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: { 
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } } 
                  }
                }} 
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="text-2xl font-bold text-foreground">{stats?.totalBookings || '0'}</span>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 border-border/60 shadow-sm h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
               <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
               <CardDescription>Latest system events and updates</CardDescription>
            </div>
            <Link href="/admin/monitoring">
                 <Button variant="outline" size="sm" className="h-8">View All Activity</Button>
            </Link>
          </CardHeader>
          <CardContent className="hover:overflow-y-auto pr-6 -mr-4 flex-1">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[2.45rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
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
                <div className="text-center py-10 text-muted-foreground">
                  Failed to load activity feed.
                </div>
              ) : activityFeed?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No recent activity to show.
                </div>
              ) : (
                activityFeed?.map((item) => {
                  const { icon, color } = getActivityIconAndColor(item.type);
                  return (
                    <div key={item.id} className="relative flex items-start group">
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ring-4 ring-background transition-transform group-hover:scale-110",
                        color
                      )}>
                        {icon}
                      </div>
                      <div className="ml-4 flex-1 pt-1.5 pl-2">
                         <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </span>
                         </div>
                         <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
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
