"use client";

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
  Download,
  BedDouble,
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
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useHostel } from '@/features/hostels';

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
              : entry.name.includes('Occupancy') || entry.name.includes('Rate')
              ? `${entry.value}%`
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Generate mock data for demonstration - replace with real API
const generateMonthlyData = (hostel: any) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const baseOccupancy = hostel?.total_rooms > 0 
    ? Math.round(((hostel.total_rooms - hostel.available_rooms) / hostel.total_rooms) * 100)
    : 70;
  const baseRevenue = parseFloat(hostel?.base_price || '5000') * (hostel?.total_rooms - hostel?.available_rooms || 10);

  return months.map((month, index) => ({
    month,
    occupancy: Math.max(50, Math.min(100, baseOccupancy + (Math.random() * 20 - 10))),
    revenue: Math.round(baseRevenue * (0.8 + Math.random() * 0.4)),
    bookings: Math.round(5 + Math.random() * 15),
  }));
};

export default function HostelAnalyticsPage() {
  const params = useParams();
  const hostelId = params.id as string;
  const [timeRange, setTimeRange] = useState('6m');
  
  const { data: hostel, isLoading } = useHostel(hostelId);

  // Generate data based on hostel
  const monthlyData = React.useMemo(() => generateMonthlyData(hostel), [hostel]);
  
  // Calculate stats
  const occupiedRooms = (hostel?.total_rooms || 0) - (hostel?.available_rooms || 0);
  const totalRooms = hostel?.total_rooms || 0;
  const occupancyRate = totalRooms > 0 
    ? Math.round((occupiedRooms / totalRooms) * 100)
    : 0;
  const estimatedRevenue = parseFloat(hostel?.base_price || '0') * occupiedRooms;
  
  // Room type distribution
  const roomDistribution = [
    { name: 'Occupied', value: occupiedRooms, color: '#10b981' },
    { name: 'Available', value: hostel?.available_rooms || 0, color: '#f59e0b' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/landlord/hostels/${hostelId}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Hostel
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-7 w-7 md:h-8 md:w-8 text-primary" />
            {hostel?.name} - Analytics
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Performance metrics and insights for this property
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] h-12 text-base font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m" className="text-base">Last Month</SelectItem>
              <SelectItem value="3m" className="text-base">Last 3 Months</SelectItem>
              <SelectItem value="6m" className="text-base">Last 6 Months</SelectItem>
              <SelectItem value="1y" className="text-base">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button size="lg" variant="outline" className="gap-2 font-bold">
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-muted-foreground">Occupancy Rate</p>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{occupancyRate}%</p>
            <Progress value={occupancyRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-muted-foreground">Monthly Revenue</p>
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              KES {(estimatedRevenue / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-muted-foreground mt-1">Estimated this month</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-muted-foreground">Active Tenants</p>
              <div className="p-2 rounded-lg bg-info/10">
                <Users className="h-5 w-5 text-info" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{occupiedRooms}</p>
            <p className="text-sm text-muted-foreground mt-1">Currently staying</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-muted-foreground">Available Beds</p>
              <div className="p-2 rounded-lg bg-warning/10">
                <BedDouble className="h-5 w-5 text-warning" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {hostel?.available_rooms || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Ready for booking</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue & Occupancy Trend */}
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monthly revenue performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000)}K`} tick={{ fill: 'currentColor' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue (KES)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Distribution */}
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-info" />
              Room Status
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Current occupancy breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <div style={{ width: '100%', height: '100%', minHeight: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {roomDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {roomDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Trend */}
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Occupancy Trend
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monthly occupancy rate changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} domain={[0, 100]} tick={{ fill: 'currentColor' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 5 }}
                      name="Occupancy Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Activity */}
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-warning" />
              Booking Activity
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monthly new bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="bookings" fill="#f59e0b" name="New Bookings" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
