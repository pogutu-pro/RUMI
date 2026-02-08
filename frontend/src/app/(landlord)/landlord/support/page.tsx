"use client";

import * as React from "react";
import { 
  Ticket, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Filter, 
  MoreVertical 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSupportTickets } from '@/features/support';
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  const [activeTab, setActiveTab] = React.useState('open');
  const { data: ticketsData, isLoading } = useSupportTickets({ 
    status: activeTab === 'all' ? undefined : (activeTab as any) 
  });
  
  // Also fetch all for stats if needed, or derived from separate stats endpoint if available.
  // For now, simple client-side stats from the 'all' fetch might be better if pagination allows,
  // but let's assume specific status fetching is more performant.
  // We'll fake stats for now or better, use a separate query for counts if API supported it.
  
  const tickets = ticketsData?.data || [];

  const getPriorityColor = (priority: string) => {
   switch (priority) {
     case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
     case 'medium': return 'bg-warning/10 text-warning border-warning/20';
     default: return 'bg-info/10 text-info border-info/20';
   }
 };

  const getStatusColor = (status: string) => {
   switch (status) {
     case 'open': return 'text-info bg-info/10';
     case 'in_progress': return 'text-warning bg-warning/10';
     case 'resolved': return 'text-success bg-success/10';
     case 'closed': return 'text-muted-foreground bg-muted';
     default: return 'text-muted-foreground bg-muted';
   }
 };

  return (
    <div className="space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Ticket className="h-8 w-8 text-success" />
            Support Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage support requests and communicate with your tenants
          </p>
        </div>

        <Button className="gap-2 bg-gradient-to-r from-success to-info text-success-foreground">
          <Plus className="h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tickets
            </CardTitle>
            <Ticket className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Priority
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">--</div>
             <p className="text-xs text-muted-foreground mt-1">Urgent issues</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">2.4h</div>
             <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="open" className="gap-2">
              <AlertCircle className="h-4 w-4" /> Open
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-2">
              <Clock className="h-4 w-4" /> In Progress
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Resolved
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" /> All Tickets
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            ))
          ) : tickets.length === 0 ? (
            <Card className="border-none shadow-md py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                   <Ticket className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-primary">No tickets found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-2">
                  There are no {activeTab === 'all' ? '' : activeTab.replace('_', ' ')} tickets at the moment.
                </p>
              </div>
            </Card>
          ) : (
            tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Link href={`/landlord/support/${ticket.id}`} className="block">
                  <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 group bg-card">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Status Icon */}
                        <div className="hidden md:flex items-center justify-center h-12 w-12 rounded-full bg-muted shrink-0 group-hover:bg-success/10 transition-colors">
                           <MessageSquare className="h-6 w-6 text-muted-foreground group-hover:text-success" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className={cn("capitalize font-normal", getPriorityColor(ticket.priority))}>
                              {ticket.priority} Priority
                            </Badge>
                            <Badge className={cn("capitalize", getStatusColor(ticket.status))}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                               <Clock className="h-3 w-3" />
                               {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-primary group-hover:text-success transition-colors">
                            {ticket.subject}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                           <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>Coming soon</span>
                           </div>
                           <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreVertical className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
