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
  Search,
  Activity,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// import { useTechSupportStore } from '@/features/support'; // Removed store
import { useAuth } from '@/features/auth';
import { 
  useSupportLogs, 
  useSupportTickets, 
  useSupportUsers, 
  useSupportTransactions,
  useSupportHostels 
} from '@/features/support/hooks/use-support';
import { Separator } from '@/components/ui/separator';

export default function TechSupportDashboard() {
  const { user } = useAuth();
  
  const { data: logs = [], isLoading: isLoadingLogs } = useSupportLogs();
  const { data: tickets = [], isLoading: isLoadingTickets } = useSupportTickets();
  const { data: users = [], isLoading: isLoadingUsers } = useSupportUsers();
  const { data: transactions = [], isLoading: isLoadingTransactions } = useSupportTransactions();
  const { data: hostels = [], isLoading: isLoadingHostels } = useSupportHostels();

  // Metrics (Derived from data arrays)
  const stats = [
    { label: "Active Tickets", value: tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10", change: "+12%" },
    { label: "Pending Verifications", value: users.filter((u: any) => !u.is_verified).length, icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", change: "-5%" },
    { label: "Payment Disputes", value: transactions.filter((t: any) => t.status === 'failed').length, icon: Activity, color: "text-red-500", bg: "bg-red-500/10", change: "+2%" },
    { label: "Avg. Response Time", value: "2.4 hrs", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10", change: "-15%" }
  ];
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Get display name
  const displayName = React.useMemo(() => {
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Tech Support';
  }, [user]);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Overview of support tickets, verifications, and system alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Quick search user or ref..." 
              className="pl-9 bg-background/50 border-input/60 focus-visible:ring-primary/20"
            />
          </div>
          <Button variant="outline" className="hidden md:flex">
            <ShieldAlert className="mr-2 h-4 w-4" />
            Priority View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-amber-500/80 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verifications</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              8 Landlords, 4 Hostels
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-destructive/80 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Complaints</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              2 Urgent, 3 Normal
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500/80 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Disputes</CardTitle>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires investigation
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500/80 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-600 dark:text-emerald-500 font-medium flex items-center gap-1 inline-flex">
                <ArrowUpRight className="h-3 w-3" /> +12%
              </span>{' '}
              vs yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Recent Activity / Tasks */}
        <Card className="col-span-4 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Priority Tasks
            </CardTitle>
            <CardDescription>Items requiring immediate attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Verify Landlord: John Doe", type: "Verification", time: "10m ago", priority: "High", colorClass: "bg-amber-500" },
                { title: "Refund Request: TXN-12345", type: "Payment", time: "30m ago", priority: "Medium", colorClass: "bg-blue-500" },
                { title: "Hostel Flagged: Sunshine Apts", type: "Safety", time: "1h ago", priority: "Critical", colorClass: "bg-destructive" },
                { title: "User Complaint: Login Issue", type: "Support", time: "2h ago", priority: "Low", colorClass: "bg-slate-500" },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`h-2.5 w-2.5 rounded-full ${task.colorClass} ring-2 ring-background`} />
                    <div>
                      <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.type} • {task.time}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats / System Status */}
        <Card className="col-span-3 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Status
            </CardTitle>
            <CardDescription>Real-time operational metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="absolute top-0 left-0 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  </div>
                  <span className="text-sm font-medium">Payment Gateway</span>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">Operational</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">SMS Service</span>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">Operational</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium">Email Delivery</span>
                </div>
                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10">Degraded</Badge>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h4 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider text-[10px]">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3 px-4 hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <Users className="mr-3 h-4 w-4 text-indigo-500" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Verify User</div>
                    <div className="text-[10px] text-muted-foreground">Manual ID check</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4 hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <Building2 className="mr-3 h-4 w-4 text-indigo-500" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Find Hostel</div>
                    <div className="text-[10px] text-muted-foreground">By name/ID</div>
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
