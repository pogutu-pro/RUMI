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
  Download, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

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

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Page() {
  // Mock Data
  const trafficData = useMemo(() => ({
    labels: months,
    datasets: [
      {
        label: "Page Views",
        data: months.map((_, i) => 5000 + i * 800 + Math.random() * 1000),
        borderColor: "#6366f1", // indigo-500
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }), []);

  const deviceData = useMemo(() => ({
    labels: ["Mobile", "Desktop", "Tablet"],
    datasets: [
      {
        data: [65, 30, 5],
        backgroundColor: [
          "#0ea5e9", // sky-500
          "#059669", // emerald-600
          "#f59e0b", // amber-500
        ],
        borderWidth: 0,
      },
    ],
  }), []);

  const conversionData = useMemo(() => ({
    labels: months,
    datasets: [
      {
        label: "Signups",
        data: months.map((_, i) => 200 + i * 20 + Math.random() * 50),
        backgroundColor: "#059669",
        borderRadius: 4,
      },
    ],
  }), []);

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
          <p className="mt-2 text-slate-500">Detailed insights into platform usage and performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Visits</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">124.5K</h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12.5%
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg. Session</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">4m 32s</h3>
              </div>
              <div className="p-2 bg-sky-50 rounded-lg">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +5.2%
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Bounce Rate</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">42.3%</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +2.1%
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Conversion</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">3.2%</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +0.8%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <Line 
                data={trafficData} 
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

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Device Usage</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[350px]">
            <div className="w-[250px] h-[250px]">
              <Doughnut 
                data={deviceData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">User Signups Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Bar 
              data={conversionData} 
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
  );
}
