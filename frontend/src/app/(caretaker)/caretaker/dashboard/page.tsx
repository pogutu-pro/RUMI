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
  Wrench,
  CheckCircle2,
  UserPlus,
  UserX,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useCaretakerDashboard } from "@/features/caretaker";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Page() {
  const { data: dashboardData, isLoading } = useCaretakerDashboard();

  // Real Data for Charts
  const weeklyStats = dashboardData?.maintenanceStats?.weeklyData || [];
  
  const barChartData = React.useMemo(
    () => ({
      labels: days,
      datasets: [
        {
          label: "New Issues",
          data: weeklyStats.map(d => d.new) || [],
          backgroundColor: "#0ea5e9", // Sky 500
          borderRadius: 4,
          barThickness: 24,
        },
        {
          label: "Resolved",
          data: weeklyStats.map(d => d.resolved) || [],
          backgroundColor: "#10b981", // Emerald 500
          borderRadius: 4,
          barThickness: 24,
        },
      ],
    }),
    [weeklyStats],
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
            font: {
              family: 'inherit',
              size: 12
            }
          },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          cornerRadius: 8,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          border: {
            display: false
          },
          ticks: {
            stepSize: 1,
            font: {
              family: 'inherit',
            }
          },
        },
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false
          },
          ticks: {
            font: {
              family: 'inherit',
            }
          }
        }
      },
    }),
    [],
  );

  const kpiCards = [
    {
      label: "Pending Approvals",
      value: dashboardData?.todayOverview.pendingApprovals || 0,
      description: "Require attention",
      icon: ClipboardList,
      href: "/caretaker/approvals"
    },
    {
      label: "Check-Ins Today",
      value: dashboardData?.todayOverview.checkInsToday || 0,
      description: "Expected arrivals",
      icon: UserPlus,
      href: "/caretaker/check-in"
    },
    {
      label: "Check-Outs Today",
      value: dashboardData?.todayOverview.checkOutsToday || 0,
      description: "Departures scheduled",
      icon: UserX,
      href: "/caretaker/check-out"
    },
    {
      label: "Open Maintenance",
      value: dashboardData?.todayOverview.unresolvedIssues || 0,
      description: `${dashboardData?.maintenanceStats.highPriority || 0} high priority`,
      icon: Wrench,
      href: "/caretaker/maintenance"
    },
  ] as const;

  const quickActions = [
    {
      title: "Check In Student",
      href: "/caretaker/check-in",
      icon: UserPlus,
      variant: "default",
    },
    {
      title: "Check Out Student",
      href: "/caretaker/check-out",
      icon: UserX,
      variant: "outline",
    },
    {
      title: "Log Issue",
      href: "/caretaker/maintenance",
      icon: Wrench,
      variant: "outline",
    },
    {
      title: "View Tenants",
      href: "/caretaker/tenants",
      icon: Users,
      variant: "ghost",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 p-1">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          Welcome back. Here's what's happening in your hostel today.
        </p>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-all active:scale-95 duration-200 border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {card.value.toLocaleString()}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Left Column: Charts & Quick Actions */}
        <div className="space-y-6 lg:col-span-5">
          {/* Quick Actions - Simplified & UX Focused */}
          <Card className="border-none shadow-none bg-transparent">
             <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
             <CardContent className="px-0 flex flex-wrap gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.title}
                    variant={action.variant as any}
                    size="lg"
                    className="h-14 gap-2 text-base font-bold shadow-sm"
                    asChild
                  >
                    <Link href={action.href}>
                      <Icon className="h-5 w-5" />
                      {action.title}
                    </Link>
                  </Button>
                )
              })}
             </CardContent>
          </Card>

          {/* Maintenance Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Weekly Maintenance</CardTitle>
              <CardDescription>Overview of reported and resolved issues</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pl-0">
              <Bar data={barChartData} options={barChartOptions} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Occupancy & Focus */}
        <div className="space-y-6 lg:col-span-2">
           {/* Today's Focus */}
           <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-background rounded-lg border shadow-sm">
                <p className="font-medium text-foreground">Check-ins Pending</p>
                 <p className="text-muted-foreground mt-1">
                    You have <span className="font-bold text-foreground">{dashboardData?.todayOverview.checkInsToday}</span> students arriving today.
                 </p>
                 <Button variant="link" className="px-0 h-auto mt-2 text-primary" asChild>
                    <Link href="/caretaker/check-in">View Arrivals →</Link>
                 </Button>
              </div>
              
              <div className="p-3 bg-background rounded-lg border shadow-sm">
                <p className="font-medium text-foreground">Pending Approvals</p>
                 <p className="text-muted-foreground mt-1">
                    <span className="font-bold text-foreground">{dashboardData?.todayOverview.pendingApprovals}</span> requests need your review.
                 </p>
                 <Button variant="link" className="px-0 h-auto mt-2 text-primary" asChild>
                    <Link href="/caretaker/approvals">Process Requests →</Link>
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Donut/Stats simplified */}
          <Card className="shadow-sm">
             <CardHeader>
              <CardTitle className="text-lg font-bold">Occupancy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold">{dashboardData?.roomOccupancy.occupancyRate}%</span>
                  <span className="text-sm font-medium text-muted-foreground mb-1">Total Capacity</span>
               </div>
               <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${dashboardData?.roomOccupancy.occupancyRate || 0}%` }}
                  />
               </div>
               <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupied</p>
                    <p className="text-xl font-bold">{dashboardData?.roomOccupancy.occupied}</p>
                  </div>
                   <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available</p>
                    <p className="text-xl font-bold">{dashboardData?.roomOccupancy.available}</p>
                  </div>
               </div>
               <Button variant="outline" className="w-full" asChild>
                 <Link href="/caretaker/room-management">Manage Rooms</Link>
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
