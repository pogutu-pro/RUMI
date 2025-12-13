"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { 
  Users,
  Home,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserPlus,
  UserX,
  ClipboardList,
  Shield,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useCaretakerDashboard } from "@/features/caretaker";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Page() {
  const { data: dashboardData, isLoading } = useCaretakerDashboard();

  const ticketsData = React.useMemo(() => {
    if (dashboardData?.maintenanceStats?.weeklyData) {
      return dashboardData.maintenanceStats.weeklyData.map(d => d.new);
    }
    return days.map((_, index) => 4 + (index % 3));
  }, [dashboardData]);

  const resolvedData = React.useMemo(() => {
    if (dashboardData?.maintenanceStats?.weeklyData) {
      return dashboardData.maintenanceStats.weeklyData.map(d => d.resolved);
    }
    return ticketsData.map((value) => Math.max(0, value - 1));
  }, [dashboardData, ticketsData]);

  const barChartData = React.useMemo(
    () => ({
      labels: days,
      datasets: [
        {
          label: "New issues",
          data: ticketsData,
          backgroundColor: "rgba(14, 165, 233, 0.8)",
          borderRadius: 6,
          barThickness: 22,
        },
        {
          label: "Resolved",
          data: resolvedData,
          backgroundColor: "rgba(5, 150, 105, 0.8)",
          borderRadius: 6,
          barThickness: 22,
        },
      ],
    }),
    [ticketsData, resolvedData],
  );

  const barChartOptions = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            usePointStyle: true,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    }),
    [],
  );

  const kpiCards = [
    {
      label: "Check-Ins Today",
      value: dashboardData?.todayOverview.checkInsToday || 0,
      description: "Expected arrivals",
      icon: UserPlus,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Check-Outs Today",
      value: dashboardData?.todayOverview.checkOutsToday || 0,
      description: "Departures scheduled",
      icon: UserX,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Pending Approvals",
      value: dashboardData?.todayOverview.pendingApprovals || 0,
      description: "Require your attention",
      icon: ClipboardList,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Open Maintenance",
      value: dashboardData?.todayOverview.unresolvedIssues || 0,
      description: `${dashboardData?.maintenanceStats.highPriority || 0} high priority`,
      icon: Wrench,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ] as const;

  const quickActions = [
    {
      title: "Check In Student",
      description: "Process new arrival",
      href: "/caretaker/check-in",
      icon: UserPlus,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Check Out Student",
      description: "Process departure",
      href: "/caretaker/check-out",
      icon: UserX,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Report Issue",
      description: "Log maintenance request",
      href: "/caretaker/maintenance",
      icon: Wrench,
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      title: "View Tenants",
      description: "Manage students",
      href: "/caretaker/tenants",
      icon: Users,
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Caretaker Dashboard
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Stay on top of check-ins, maintenance, and tenant needs for your hostel.
        </p>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className={cn("border-none shadow-sm transition-all hover:shadow-md", card.bgColor)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <div className={cn("p-2 rounded-lg", card.bgColor)}>
                    <Icon className={cn("h-4 w-4", card.color)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold">
                  {card.value.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="h-full hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                  <CardContent className="p-6">
                    <div className={cn("inline-flex p-3 rounded-lg text-white mb-4", action.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Maintenance Chart */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Maintenance & Issue Volume
            </CardTitle>
            <CardDescription>Weekly overview of maintenance requests</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <Bar data={barChartData} options={barChartOptions} />
          </CardContent>
        </Card>

        {/* Room Occupancy */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Room Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Occupied</span>
                <span className="font-semibold">
                  {dashboardData?.roomOccupancy.occupied || 0}/{dashboardData?.roomOccupancy.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${dashboardData?.roomOccupancy.occupancyRate || 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.roomOccupancy.occupancyRate || 0}% occupancy rate
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Occupied</span>
                </div>
                <span className="font-semibold">{dashboardData?.roomOccupancy.occupied || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-sm">Available</span>
                </div>
                <span className="font-semibold">{dashboardData?.roomOccupancy.available || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Maintenance</span>
                </div>
                <span className="font-semibold">{dashboardData?.roomOccupancy.underMaintenance || 0}</span>
              </div>
            </div>

            <Button variant="outline" className="wfull mt-4" asChild>
              <Link href="/caretaker/room-management">
                View All Rooms <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Today's Focus */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            Prioritize high-severity maintenance tasks and check-out inspections to avoid deposit disputes and negative reviews.
          </p>
          <p className="text-foreground">
            Use the damage reports and maintenance sections to update statuses in real time so landlords and students stay aligned.
          </p>
          <p className="text-muted-foreground">
            Remember to log all visitor entries and complete night checks for today.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
