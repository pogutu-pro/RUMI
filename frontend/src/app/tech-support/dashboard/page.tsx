"use client";

import React from 'react';
import { 
  Users, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ShieldAlert,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

export default function TechSupportDashboard() {
  const { user } = useAuth();
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Get display name
  const displayName = React.useMemo(() => {
    if (user?.firstName) return user.firstName;
    if (user?.email) return user.email.split('@')[0];
    return 'Tech Support';
  }, [user]);
  
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of support tickets, verifications, and system alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Quick search user or ref..." 
              className="pl-9"
            />
          </div>
          <Button>
            <ShieldAlert className="mr-2 h-4 w-4" />
            View High Priority
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verifications</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-slate-500 mt-1">
              8 Landlords, 4 Hostels
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Complaints</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-slate-500 mt-1">
              2 Urgent, 3 Normal
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Disputes</CardTitle>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-slate-500 mt-1">
              Requires investigation
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-green-600 font-medium flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +12%
              </span>
              from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Recent Activity / Tasks */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Priority Tasks</CardTitle>
            <CardDescription>Items requiring immediate attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Verify Landlord: John Doe", type: "Verification", time: "10m ago", priority: "High", color: "orange" },
                { title: "Refund Request: TXN-12345", type: "Payment", time: "30m ago", priority: "Medium", color: "blue" },
                { title: "Hostel Flagged: Sunshine Apts", type: "Safety", time: "1h ago", priority: "Critical", color: "red" },
                { title: "User Complaint: Login Issue", type: "Support", time: "2h ago", priority: "Low", color: "slate" },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full bg-${task.color}-500`} />
                    <div>
                      <p className="font-medium text-sm text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.type} • {task.time}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats / System Status */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Operational metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Payment Gateway</span>
                </div>
                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">SMS Service</span>
                </div>
                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">Email Delivery</span>
                </div>
                <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">Degraded</Badge>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-medium mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3 px-4">
                  <Users className="mr-2 h-4 w-4 text-indigo-500" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Verify User</div>
                    <div className="text-[10px] text-slate-500">Manual ID check</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4">
                  <Building2 className="mr-2 h-4 w-4 text-indigo-500" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Find Hostel</div>
                    <div className="text-[10px] text-slate-500">By name/ID</div>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
