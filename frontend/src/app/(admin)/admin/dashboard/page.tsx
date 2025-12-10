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
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { 
  TrendingUp,
  Users,
  DollarSign,
  Home,
  Activity
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { useAnalytics } from "@/hooks/use-analytics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Page() {
  const { data: analytics, isLoading } = useAnalytics();

  const userGrowthData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: "Students",
        data: [65, 78, 90, 112, 130, 145],
        borderColor: "#0ea5e9",
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Landlords",
        data: [28, 35, 42, 48, 55, 62],
        borderColor: "#059669",
        backgroundColor: "rgba(5, 150, 105, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }), []);

  const revenueData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: "Revenue (KES)",
        data: [45000, 52000, 48000, 61000, 58000, 67000],
        backgroundColor: "#059669",
        borderRadius: 4,
      },
    ],
  }), []);

  const userDistributionData = useMemo(() => ({
    labels: ["Students", "Landlords", "Caretakers", "Admins"],
    datasets: [
      {
        data: [145, 62, 18, 5],
        backgroundColor: [
          "#0ea5e9", // sky-500
          "#059669", // emerald-600
          "#f59e0b", // amber-500
          "#6366f1", // indigo-500
        ],
        borderWidth: 0,
      },
    ],
  }), []);

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-500">Overview of platform performance and key metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Users</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics?.totalUsers?.toLocaleString() || '0'}</h3>
              </div>
              <div className="p-2 bg-sky-50 rounded-lg">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +{analytics?.userGrowth?.percentage || 0}% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">KES {analytics?.totalRevenue?.toLocaleString() || '0'}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +{analytics?.revenueGrowth?.percentage || 0}% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Hostels</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics?.totalHostels || 0}</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Home className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Platform Growth</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">+{analytics?.bookingGrowth?.percentage || 0}%</h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Consistent growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line 
                data={userGrowthData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { 
                    y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
                    x: { grid: { display: false } }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar 
                data={revenueData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { 
                    y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
                    x: { grid: { display: false } }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Distribution & Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-none shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">User Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-[200px] h-[200px]">
              <Doughnut 
                data={userDistributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { description: 'New student registered: John Doe', time: '2 minutes ago' },
                { description: 'Booking confirmed for Oakwood Hostel', time: '15 minutes ago' },
                { description: 'Payment received from Jane Smith', time: '1 hour ago' },
                { description: 'New hostel listed: Campus View Residence', time: '3 hours ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
