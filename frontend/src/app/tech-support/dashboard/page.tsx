"use client";

import React, { useMemo } from 'react';
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
  ShieldCheck,
  TrendingUp,
  LifeBuoy,
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth';
import { 
  useSupportTickets, 
  useSupportStats,
  useTechSupportSystemHealth,
  useSupportAnalytics,
  useTechSupportTeam
} from '@/features/support/hooks/use-support';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function TechSupportDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Real Data Hooks
  const { data: statsRes, isLoading: isLoadingStats } = useSupportStats();
  const { data: ticketsRes, isLoading: isLoadingTickets } = useSupportTickets({ status: 'open' }); // Fetch open specifically for priority
  const { data: healthRes, isLoading: isLoadingHealth } = useTechSupportSystemHealth();
  const { data: analyticsRes, isLoading: isLoadingAnalytics } = useSupportAnalytics();
  const { data: teamRes, isLoading: isLoadingTeam } = useTechSupportTeam();

  const stats = statsRes?.data || {};
  const tickets = ticketsRes?.data || [];
  const health = healthRes?.data || {};
  const analytics = analyticsRes?.data || [];
  const team = teamRes?.data || [];
  // Assuming team API returns list of users, we'll take top 5 available
  const availableTeam = Array.isArray(team) ? team.slice(0, 5) : [];

  // Computed Metrics
  const activeTicketsCount = stats.open_tickets || tickets.length || 0;
  const resolvedCount = stats.resolved_tickets || 0;
  const pendingVerifications = stats.pending_verifications || 0;
  const criticalCount = tickets.filter((t: any) => t.priority === 'critical').length || 0;

  // Process Analytics Data for Tickets
  const ticketVolumeData = useMemo(() => {
     if (Array.isArray(analytics) && analytics.length > 0) {
         return analytics.map((day: any) => ({
             name: day.date ? format(new Date(day.date), 'EEE') : day.name,
             tickets: day.tickets_created || day.tickets || 0,
             resolved: day.tickets_resolved || day.resolved || 0
         }));
     }
     return [];
  }, [analytics]);

  // System Health Status Map
  const systemComponents = [
    { name: 'API Gateway', status: health.api_status || 'operational' },
    { name: 'Database', status: health.db_status || 'operational' },
    { name: 'Auth Service', status: health.auth_status || 'operational' },
    { name: 'Payments', status: health.payment_gateway || 'degraded' },
  ];
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  const displayName = useMemo(() => {
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Tech Support';
  }, [user]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-muted-foreground font-medium">
            System overview and support command center.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              type="search" 
              placeholder="Search tickets, users, logs..." 
              className="pl-9 bg-background/60 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
            />
          </div>
          <Button 
            className="hidden md:flex shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
            onClick={() => router.push('/tech-support/complaints')}
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            View Ticket Queue
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Active Tickets" 
          value={activeTicketsCount}
          subtitle="Requires attention"
          icon={LifeBuoy}
          colorClass="text-blue-500"
          bgClass="bg-blue-500/10"
          trend="+12% vs last week"
          isLoading={isLoadingStats}
        />
        <StatsCard 
          title="Critical Issues" 
          value={criticalCount}
          subtitle="Immediate priority"
          icon={AlertCircle}
          colorClass="text-red-500"
          bgClass="bg-red-500/10"
          trend="Stable"
          isLoading={isLoadingTickets}
        />
        <StatsCard 
          title="Resolved Today" 
          value={resolvedCount}
          subtitle="Closed Successfully"
          icon={CheckCircle2}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-500/10"
          trend="+5% vs yesterday"
          isLoading={isLoadingStats}
        />
        <StatsCard 
          title="Pending Verifications" 
          value={pendingVerifications}
          subtitle="Landlords & Hostels"
          icon={ShieldCheck}
          colorClass="text-amber-500"
          bgClass="bg-amber-500/10"
          trend="-2 pending"
          isLoading={isLoadingStats}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        
        {/* Left Column: Charts & Activity */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Analytics Chart */}
          <Card className="shadow-md border-border/50 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Support Volume Trends
                  </CardTitle>
                  <CardDescription>Weekly ticket inflow vs resolution rate</CardDescription>
                </div>
                <Badge variant="outline" className="bg-background/50">Last 7 Days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ticketVolumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="name" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" name="New Tickets" />
                    <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Critical Tasks List */}
          <Card className="shadow-md border-border/50 bg-card/60 backdrop-blur-xl">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Priority Tasks
                </CardTitle>
                <CardDescription>High priority items requiring immediate attention</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-3">
                    {isLoadingTickets ? (
                        [1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>No high priority tickets pending.</p>
                        </div>
                    ) : (
                        tickets.slice(0, 5).map((ticket: any) => (
                            <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/40 hover:bg-muted/40 transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                        ticket.priority === 'critical' ? "bg-red-500/10 text-red-600" :
                                        ticket.priority === 'high' ? "bg-orange-500/10 text-orange-600" :
                                        "bg-blue-500/10 text-blue-600"
                                    )}>
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{ticket.subject}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] h-5">{ticket.category}</Badge>
                                            <span className="text-xs text-muted-foreground">• {new Date(ticket.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/tech-support/tickets/${ticket.id}`)}>
                                    Review
                                </Button>
                            </div>
                        ))
                    )}
                </div>
             </CardContent>
          </Card>

        </div>

        {/* Right Column: System Health & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* System Status */}
          <Card className="shadow-md border-border/50 bg-card/60 backdrop-blur-xl">
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="h-4 w-4 text-emerald-500" />
                    System Status
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                {isLoadingHealth ? (
                   [1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />) 
                ) : (
                    systemComponents.map((component, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-2.5 w-2.5 rounded-full relative",
                                    component.status === 'operational' ? "bg-emerald-500" : 
                                    component.status === 'degraded' ? "bg-amber-500" : "bg-red-500"
                                )}>
                                    {component.status === 'operational' && (
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{component.name}</p>
                                </div>
                            </div>
                            <Badge 
                                variant="outline" 
                                className={cn(
                                    "text-[10px] capitalize border-0",
                                    component.status === 'operational' ? "bg-emerald-500/10 text-emerald-600" :
                                    component.status === 'degraded' ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                                )}>
                                {component.status}
                            </Badge>
                        </div>
                    ))
                )}
             </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-md border-border/50 bg-card/60 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-blue-500/5 hover:border-blue-500/30 transition-all font-normal" onClick={() => router.push('/tech-support/users')}>
                    <Users className="mr-3 h-5 w-5 text-blue-500" />
                    Verify Landlord ID
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-purple-500/5 hover:border-purple-500/30 transition-all font-normal" onClick={() => router.push('/tech-support/hostels')}>
                    <Building2 className="mr-3 h-5 w-5 text-purple-500" />
                    Review Hostel Listing
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-orange-500/5 hover:border-orange-500/30 transition-all font-normal" onClick={() => router.push('/tech-support/complaints')}>
                    <AlertCircle className="mr-3 h-5 w-5 text-orange-500" />
                    Resolve Dispute
                </Button>
            </CardContent>
          </Card>

          {/* Team Availability */}
          <Card className="shadow-md border-border/50 bg-card/60 backdrop-blur-xl">
             <CardHeader>
                <CardTitle className="text-base text-muted-foreground">Team Online</CardTitle>
             </CardHeader>
             <CardContent>
                {isLoadingTeam ? (
                    <Skeleton className="h-8 w-full rounded-full" />
                ) : availableTeam.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active team members.</p>
                ) : (
                    <div className="flex -space-x-3 overflow-hidden p-1">
                        {availableTeam.map((member: any, i: number) => (
                             <div key={member.id} title={member.name || member.email} className="h-8 w-8 rounded-full ring-2 ring-background bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground cursor-help">
                                {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                             </div>
                        ))}
                        {team.length > 5 && (
                            <div className="h-8 w-8 rounded-full ring-2 ring-background bg-slate-100 flex items-center justify-center text-xs text-muted-foreground">
                                +{team.length - 5}
                            </div>
                        )}
                    </div>
                )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, subtitle, icon: Icon, colorClass, bgClass, trend, isLoading }: any) {
    return (
        <Card className="shadow-md border-border/50 bg-card/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                   <div className={cn("p-3 rounded-xl transition-colors", bgClass)}>
                       <Icon className={cn("h-6 w-6", colorClass)} />
                   </div>
                   {trend && (
                       <Badge variant="secondary" className={cn("bg-background/80 text-[10px]", 
                           trend.includes('+') ? "text-emerald-600" : "text-muted-foreground"
                       )}>
                           {trend}
                       </Badge>
                   )}
                </div>
                <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    {isLoading ? (
                        <Skeleton className="h-8 w-20 mt-1" />
                    ) : (
                        <h3 className="text-2xl font-bold text-foreground mt-1 group-hover:translate-x-1 transition-transform">{value}</h3>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}
