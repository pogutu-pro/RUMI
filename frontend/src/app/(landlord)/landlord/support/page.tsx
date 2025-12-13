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
  
  const tickets = ticketsData?.results || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-900';
      case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'in_progress': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'resolved': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'closed': return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Ticket className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Support Center
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage support requests and communicate with your tenants
          </p>
        </div>

        <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600">
          <Plus className="h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Open Tickets
            </CardTitle>
            <Ticket className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              High Priority
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">--</div>
             <p className="text-xs text-muted-foreground mt-1">Urgent issues</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Avg. Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
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
          <TabsList className="bg-slate-100 dark:bg-slate-800">
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
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                   <Ticket className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No tickets found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-2">
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
                  <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 group bg-white dark:bg-slate-900/50">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Status Icon */}
                        <div className="hidden md:flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                           <MessageSquare className="h-6 w-6 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className={cn("capitalize font-normal", getPriorityColor(ticket.priority))}>
                              {ticket.priority} Priority
                            </Badge>
                            <Badge className={cn("capitalize", getStatusColor(ticket.status))}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                               <Clock className="h-3 w-3" />
                               {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {ticket.subject}
                          </h3>
                          <p className="text-sm text-slate-500 line-clamp-1 mt-1">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500">
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
