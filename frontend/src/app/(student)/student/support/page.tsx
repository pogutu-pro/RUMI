'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMySupportTickets } from '@/features/support';
import { useStudentDashboard } from '@/features/student';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LifeBuoy, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Plus, 
  AlertCircle,
  ChevronRight,
  User,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function SupportPage() {
  const { data: tickets, isLoading: isLoadingTickets } = useMySupportTickets();
  const { data: dashboardData, isLoading: isLoadingDashboard } = useStudentDashboard();

  const openTickets = React.useMemo(() => {
    return tickets?.filter((t) => ['open', 'in_progress'].includes(t.status)) || [];
  }, [tickets]);

  const resolvedTickets = React.useMemo(() => {
    return tickets?.filter((t) => ['resolved', 'closed'].includes(t.status)) || [];
  }, [tickets]);

  const caretaker = dashboardData?.hostelInfo;

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/50 pb-10 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Support Terminal</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Access technical assistance for maintenance, billing, or general administrative inquiries.
          </p>
        </div>
        <Button asChild className="font-bold h-11 px-6 rounded-xl shadow-sm">
          <Link href="/student/support/new">
            <Plus className="h-4 w-4 mr-2" />
            File Support Ticket
          </Link>
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Quick Stats */}
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="border border-border/50 bg-card shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted border border-border/50 flex items-center justify-center text-foreground">
                  <AlertCircle className="h-5 w-5 opacity-70" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{openTickets.length}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">Active Cases</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/50 bg-card shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted border border-border/50 flex items-center justify-center text-foreground">
                  <CheckCircle2 className="h-5 w-5 opacity-70" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{resolvedTickets.length}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">Resolved Cases</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/50 bg-primary/5 border-primary/20 shadow-none">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-background border border-border/50 flex items-center justify-center text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">2.4h</p>
                  <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">MTTR Index</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets List */}
          <Tabs defaultValue="open" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="h-11 p-1 bg-muted/50 border border-border/50">
                <TabsTrigger value="open" className="font-bold text-xs uppercase tracking-wider px-6">Active</TabsTrigger>
                <TabsTrigger value="resolved" className="font-bold text-xs uppercase tracking-wider px-6">Archives</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="open" className="space-y-4">
               <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Case Monitoring</h2>
              {isLoadingTickets ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : openTickets.length > 0 ? (
                <div className="grid gap-4">
                  {openTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No active cases detected" 
                  description="All submitted support requests have been processed or resolved." 
                />
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Resolution History</h2>
              {isLoadingTickets ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : resolvedTickets.length > 0 ? (
                <div className="grid gap-4">
                  {resolvedTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No historical data" 
                  description="Your resolution logs will be cataloged here for future reference." 
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-8">
          {/* Caretaker Card */}
          <Card className="border border-border/50 bg-card shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <User className="h-4 w-4" />
                Assigned Personnel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {isLoadingDashboard ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : caretaker ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-foreground">{caretaker.caretaker_name || 'Registry Pending'}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Caretaker / Facility Management</p>
                  </div>
                  <div className="p-4 bg-muted/20 border border-border/20 rounded-lg space-y-2">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Standard Operations</p>
                     <p className="text-xs font-semibold">Mon - Fri: 08:00 - 18:00</p>
                  </div>
                  <Button size="lg" variant="secondary" className="w-full font-bold h-11 border border-border/50">
                    <Phone className="h-4 w-4 mr-2" />
                    Direct Contact
                  </Button>
                </>
              ) : (
                <p className="text-xs font-medium text-muted-foreground">Personnel allocation is currently in progress.</p>
              )}
            </CardContent>
          </Card>

          {/* FAQ / Help Links */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Technical Resources</h3>
             <Card className="border border-border/50 overflow-hidden shadow-sm">
                <CardContent className="p-0">
                    <div className="flex flex-col">
                        {[
                            { title: 'Network Connectivity', category: 'Infrastructure' },
                            { title: 'Payment Verification', category: 'Financial' },
                            { title: 'Facility Regulations', category: 'Policy' },
                            { title: 'Maintenance Protocols', category: 'Operational' }
                        ].map((topic, i) => (
                        <Link 
                            key={topic.title} 
                            href="#" 
                            className={cn(
                            "flex items-center justify-between p-5 hover:bg-muted/30 transition-colors group",
                            i !== 3 && "border-b border-border/50"
                            )}
                        >
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{topic.title}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{topic.category}</p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        ))}
                    </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: any }) {
  const isResolved = ['resolved', 'closed'].includes(ticket.status);
  
  return (
    <Card className="group border border-border/50 bg-card shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6 flex items-start gap-5">
        <div className={cn(
          "h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 border",
          isResolved ? "bg-muted/30 border-border/50 text-muted-foreground opacity-50" : "bg-primary/5 border-primary/20 text-primary"
        )}>
          {isResolved ? <CheckCircle2 className="h-5 w-5" /> : <LifeBuoy className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 h-5 rounded-md bg-muted border-none">
                {ticket.category}
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground opacity-50 tracking-widest">
                ID#{ticket.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-foreground truncate pr-10 group-hover:text-primary transition-colors">
                {ticket.subject}
            </h3>
            <p className="text-sm font-medium text-muted-foreground line-clamp-1 opacity-80 leading-relaxed">
                {ticket.description}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="self-center border border-transparent hover:border-border/50 h-10 w-10 shadow-none" asChild>
          <Link href={`/student/support/${ticket.id}`}>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-5">
        <LifeBuoy className="h-8 w-8 text-muted-foreground opacity-20" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-xs font-medium text-muted-foreground max-w-xs">{description}</p>
      </div>
    </div>
  );
}
