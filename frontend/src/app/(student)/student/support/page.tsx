'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMySupportTickets } from '@/features/support';
import { useStudentDashboard } from '@/features/student';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LifeBuoy, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Plus, 
  MessageSquare, 
  AlertCircle,
  ChevronRight,
  User
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support & Help</h1>
          <p className="text-muted-foreground mt-1">
            Get assistance with maintenance, billing, or general inquiries.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
          <Link href="/student/support/new">
            <Plus className="h-4 w-4 mr-2" />
            Create New Ticket
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{openTickets.length}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Open Tickets</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resolvedTickets.length}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Resolved</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">~2h</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Response</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets List */}
          <Tabs defaultValue="open" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="open">Open Issues</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="open" className="space-y-4">
              {isLoadingTickets ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : openTickets.length > 0 ? (
                <div className="grid gap-3">
                  {openTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No open tickets" 
                  description="You don't have any pending support requests." 
                />
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {isLoadingTickets ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : resolvedTickets.length > 0 ? (
                <div className="grid gap-3">
                  {resolvedTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No resolved tickets" 
                  description="Your history of resolved issues will appear here." 
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Caretaker Card */}
          <Card className="bg-primary text-primary-foreground border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <User className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary-foreground" />
                Your Caretaker
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {isLoadingDashboard ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32 bg-white/20" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
              ) : caretaker ? (
                <>
                  <div>
                    <p className="text-2xl font-bold">{caretaker.caretakerName || 'Not Assigned'}</p>
                    <p className="text-primary-foreground/80 text-sm">Available 8:00 AM - 6:00 PM</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="w-full font-semibold">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-primary-foreground/70">No caretaker information available.</p>
              )}
            </CardContent>
          </Card>

          {/* FAQ / Help Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Common Topics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {['Wifi Connection Issues', 'Payment Methods', 'Guest Policy', 'Maintenance Request'].map((topic, i) => (
                  <Link 
                    key={topic} 
                    href="#" 
                    className={cn(
                      "flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-sm",
                      i !== 3 && "border-b"
                    )}
                  >
                    {topic}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: any }) {
  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary">
      <CardContent className="p-4 sm:p-6 flex items-start gap-4">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
          ticket.status === 'resolved' ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
        )}>
          {ticket.status === 'resolved' ? <CheckCircle2 className="h-5 w-5" /> : <LifeBuoy className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {ticket.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                #{ticket.id.slice(0, 8)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </span>
          </div>
          <h3 className="font-semibold text-base mb-1 truncate pr-4 group-hover:text-primary transition-colors">
            {ticket.subject}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {ticket.description}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="self-center opacity-0 group-hover:opacity-100 transition-opacity" asChild>
          <Link href={`/student/support/${ticket.id}`}>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <LifeBuoy className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-sm mt-1">{description}</p>
    </div>
  );
}
