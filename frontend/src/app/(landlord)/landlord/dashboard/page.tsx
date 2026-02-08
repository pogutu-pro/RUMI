"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Activity,
  UserPlus,
  CreditCard,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';
import { useHostels } from '@/features/hostels';
import { usePaymentStats } from '@/features/payments';
import { useLandlordDashboard, useLandlordActivityFeed } from '@/features/landlord';

// Custom tooltip for charts - theme adaptive
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
        <p className="text-sm font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-muted-foreground">
            <span className="font-semibold">{entry.name}:</span>{' '}
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

// Helper function to get activity icon
function getActivityIcon(type: string): React.ElementType {
  const iconMap: Record<string, React.ElementType> = {
    booking: CheckCircle2,
    payment: DollarSign,
    alert: Clock,
    maintenance: Clock,
    cancellation: Clock,
  };
  return iconMap[type] || Activity;
}

// Helper function to get activity color
function getActivityColor(type: string): string {
  const colorMap: Record<string, string> = {
    booking: 'text-success',
    payment: 'text-info',
    alert: 'text-warning',
    maintenance: 'text-warning',
    cancellation: 'text-destructive',
  };
  return colorMap[type] || 'text-muted-foreground';
}

export default function LandlordDashboard() {
  const { user } = useAuth();
  const { data: hostelsData, isLoading: hostelsLoading } = useHostels();
  const { data: paymentStats, isLoading: statsLoading } = usePaymentStats();
  const { data: dashboardData, isLoading: dashboardLoading } = useLandlordDashboard();
  const { data: activities = [], isLoading: activitiesLoading } = useLandlordActivityFeed(4);

  const loading = hostelsLoading || statsLoading || dashboardLoading;

  const hostels = hostelsData?.results || [];
  const activeHostelsCount = hostels.length;
  
  const totalRooms = hostels.reduce((sum, h) => sum + h.total_rooms, 0);
  const totalOccupied = hostels.reduce((sum, h) => sum + (h.total_rooms - h.available_rooms), 0);
  const occupancyRate = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;
  
  const totalRevenue = paymentStats?.totalRevenue || 0;
  const pendingActions = dashboardData?.stats?.pendingActions || 0;

  // Chart data from API
  const monthlyRevenueData = dashboardData?.monthlyRevenue || [];
  const bookingStatusData = dashboardData?.bookingStatus 
    ? [
        { name: 'Confirmed', value: dashboardData.bookingStatus.confirmed, color: 'hsl(var(--success))' },
        { name: 'Pending', value: dashboardData.bookingStatus.pending, color: 'hsl(var(--warning))' },
        { name: 'Cancelled', value: dashboardData.bookingStatus.cancelled, color: 'hsl(var(--destructive))' },
      ]
    : [];

  // Map activities with icons
  const recentActivities = activities.map(activity => ({
    ...activity,
    icon: getActivityIcon(activity.type),
    color: getActivityColor(activity.type),
  }));

  const displayName = React.useMemo(() => {
    if (!user) return 'Landlord';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email.split('@')[0];
  }, [user]);

  // KPI Cards - Most important info for landlords
  const kpiCards = [
    {
      label: "Monthly Revenue",
      value: loading ? '...' : `KES ${(totalRevenue / 1000).toFixed(0)}K`,
      description: "Total earnings this month",
      icon: DollarSign,
      href: "/landlord/payments",
      iconColor: "text-success"
    },
    {
      label: "Occupancy Rate",
      value: loading ? '...' : `${occupancyRate}%`,
      description: `${totalOccupied} of ${totalRooms} beds filled`,
      icon: TrendingUp,
      href: "/landlord/hostels",
      iconColor: "text-primary"
    },
    {
      label: "Active Properties",
      value: loading ? '...' : activeHostelsCount.toString(),
      description: "Hostels managed",
      icon: Building2,
      href: "/landlord/hostels",
      iconColor: "text-info"
    },
    {
      label: "Pending Actions",
      value: loading ? '...' : pendingActions.toString(),
      description: "Items need attention",
      icon: Clock,
      href: "/landlord/bookings",
      iconColor: "text-warning"
    },
  ];

  // Quick Actions - Core tasks landlords do frequently
  const quickActions = [
    {
      title: "Add New Hostel",
      description: "Register a new property",
      href: "/landlord/hostels/new",
      icon: Building2,
      variant: "default",
    },
    {
      title: "View Tenants",
      description: "See all your tenants",
      href: "/landlord/tenants",
      icon: Users,
      variant: "outline",
    },
    {
      title: "View Payments",
      description: "Track transactions",
      href: "/landlord/payments",
      icon: CreditCard,
      variant: "outline",
    },
    {
      title: "View Analytics",
      description: "See detailed reports",
      href: "/landlord/analytics",
      icon: BarChart3,
      variant: "outline",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 p-1 animate-in fade-in duration-300">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header - Simple greeting for elderly users */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {displayName.split(' ')[0]}
        </h1>
        <p className="text-base text-muted-foreground">
          Here's how your properties are doing today.
        </p>
      </div>

      {/* KPI Cards - Large, clear, easy to read */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-all active:scale-[0.98] duration-200 border shadow-sm bg-card h-full group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                    {card.label}
                  </CardTitle>
                  <Icon className={cn("h-5 w-5 text-muted-foreground group-hover:scale-110 transition-transform", card.iconColor)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {card.value}
                  </div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      {/* Quick Actions - Large buttons, easy to tap */}
      <Card className="border shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">Quick Actions</CardTitle>
          <CardDescription className="text-muted-foreground">
            Common tasks you can do right now
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant as any}
                size="lg"
                className={cn(
                  "h-auto py-4 px-4 flex flex-col items-center gap-2 text-center",
                  action.variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                asChild
              >
                <Link href={action.href}>
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-bold">{action.title}</span>
                  <span className="text-xs opacity-80 hidden md:block">{action.description}</span>
                </Link>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column: Revenue Chart */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue & Occupancy
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Monthly performance over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] md:h-[350px]">
              <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                      tickFormatter={(value) => `${(value / 1000)}K`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue (KES)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Bookings & Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Booking Status - Simple pie */}
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">
                Booking Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <div style={{ width: '100%', height: '100%', minHeight: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {bookingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                {bookingStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent activity
                </p>
              ) : (
                recentActivities.slice(0, 4).map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn('p-1.5 rounded-lg bg-muted', activity.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                <Link href="/landlord/notifications">
                  View All Activity
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hostel Performance - Simple list */}
      {dashboardData?.hostelPerformance && dashboardData.hostelPerformance.length > 0 && (
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Your Properties
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Performance of each hostel
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/landlord/hostels">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.hostelPerformance.slice(0, 3).map((hostel, index) => (
                <div
                  key={hostel.id || index}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground truncate">
                      {hostel.name}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {hostel.occupancy}% occupied
                      </span>
                    </div>
                    <Progress value={hostel.occupancy} className="mt-2 h-2" />
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-foreground">
                      KES {(hostel.revenue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
