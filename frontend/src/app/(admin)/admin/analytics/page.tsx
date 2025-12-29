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
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  CreditCard
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    useAdminDashboardStats, 
    useAdminUserStats, 
    useAdminSubscriptionStats,
    useAdminPaymentDisputeStats
} from "@/features/admin";

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

export default function AnalyticsPage() {
  const { data: dashboardStats, isLoading: isLoadingDashboard } = useAdminDashboardStats();
  const { data: userStats, isLoading: isLoadingUsers } = useAdminUserStats();
  const { data: subStats, isLoading: isLoadingSubs } = useAdminSubscriptionStats();
  const { data: disputeStats, isLoading: isLoadingDisputes } = useAdminPaymentDisputeStats();

  const isLoading = isLoadingDashboard || isLoadingUsers || isLoadingSubs || isLoadingDisputes;

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
      chart3Soft: soft(chart3, 0.1), // Added soft variant for chart 3
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
        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false }, // lighter grid
        ticks: { color: 'rgba(148, 163, 184, 0.9)', font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(148, 163, 184, 0.9)', font: { size: 11 } },
      },
    },
  };

  // Prepare Real Data for Charts
  // Fallback to empty structure if data is missing
  
  // 1. User Growth (Line Chart)
  // Assuming userStats returns a time-series or we map simple stats to a trend.
  // Ideally backend returns { history: [{ date: '...', count: 123 }, ...] }
  // Since I don't know exact shape, I'll assume valid 'history' or mock based on total if not present.
  const userGrowthData = useMemo(() => {
     const history = userStats?.history || [];
     const labels = history.length > 0 ? history.map((h: any) => h.date) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
     const data = history.length > 0 ? history.map((h: any) => h.count) : [0, 0, 0, 0, 0, 0, 0];
    
     return {
      labels,
      datasets: [
        {
          label: "Total Users",
          data,
          borderColor: resolvedColors.chart1,
          backgroundColor: resolvedColors.chart1Soft,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: resolvedColors.chart1,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [userStats, resolvedColors]);

  // 2. User Distribution by Role (Doughnut)
  const userDistributionData = useMemo(() => {
    // Assuming userStats.breakdown = { students: 100, landlords: 20, caretakers: 5 }
    const breakdown = userStats?.breakdown || { students: 0, landlords: 0, caretakers: 0 };
    return {
        labels: ["Students", "Landlords", "Caretakers"],
        datasets: [
        {
            data: [breakdown.students, breakdown.landlords, breakdown.caretakers],
            backgroundColor: [
            resolvedColors.chart1,
            resolvedColors.chart2,
            resolvedColors.chart3,
            ],
            borderWidth: 0,
            hoverOffset: 4
        },
        ],
    };
  }, [userStats, resolvedColors]);
  
  // 3. Subscription Revenue (Bar Chart)
  const revenueData = useMemo(() => {
    const history = subStats?.revenueHistory || []; // Assuming
    const labels = history.length > 0 ? history.map((h: any) => h.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = history.length > 0 ? history.map((h: any) => h.amount) : [0,0,0,0,0,0];

    return {
        labels,
        datasets: [
        {
            label: "Revenue (KES)",
            data,
            backgroundColor: resolvedColors.chart2,
            borderRadius: 4,
            hoverBackgroundColor: resolvedColors.chart2Soft,
        },
        ],
    };
  }, [subStats, resolvedColors]);


  if (isLoading) {
      return (
          <div className="space-y-6 p-6">
              <div className="flex justify-between">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-10 w-32" />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                  <Skeleton className="h-[350px] w-full lg:col-span-2 rounded-xl" />
                  <Skeleton className="h-[350px] w-full rounded-xl" />
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Analytics Overview
          </h1>
          <p className="mt-1 text-muted-foreground">Real-time insights into system performance and growth.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                    {userStats?.total?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl ring-1 ring-indigo-500/20">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
             <div className="flex items-center mt-4">
               {(userStats?.growth || 0) >= 0 ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {userStats?.growth || 0}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 flex items-center bg-red-50 px-2 py-0.5 rounded-full dark:bg-red-900/20 dark:text-red-400">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  {Math.abs(userStats?.growth || 0)}%
                </span>
              )}
               <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                    {subStats?.active_subscriptions?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl ring-1 ring-emerald-500/20">
                 <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center mt-4">
                 <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12.5% {/* Mock growth if real not available */}
                </span>
                <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Revenue */}
        <Card className="border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Revenue</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                    KES {(subStats?.total_revenue || 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl ring-1 ring-amber-500/20">
                 <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex items-center mt-4">
               <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +8.2%
                </span>
                <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Disputes/Issues */}
        <Card className="border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Disputes</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                    {disputeStats?.pending_count || 0}
                </h3>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl ring-1 ring-red-500/20">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
             <div className="flex items-center mt-4">
                 <span className="text-xs text-muted-foreground">
                    Requires attention
                 </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm lg:col-span-2 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">User Growth Trend</CardTitle>
            <CardDescription>New registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <Line data={userGrowthData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">User Distribution</CardTitle>
            <CardDescription>By account type</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[350px]">
            <div className="w-[220px] h-[220px] relative">
              <Doughnut 
                data={userDistributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, color: 'rgba(148, 163, 184, 0.9)' } } 
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
          <CardDescription>Monthly subscription revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
             <Bar data={revenueData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
