"use client";

import { useState } from "react";
import { 
  MessageCircle, 
  Search, 
  Filter, 
  CheckCircle,
  Clock,
  MoreVertical,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupportTickets, useUpdateTicketStatus } from "@/hooks/use-support";
import { SupportTicket } from "@/types/entities.types";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: tickets, isLoading } = useSupportTickets();
  const updateStatus = useUpdateTicketStatus();

  const handleStatusChange = (id: string, status: SupportTicket['status']) => {
    updateStatus.mutate({ id, status });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
        case 'urgent': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 capitalize">Urgent</Badge>;
        case 'high': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 capitalize">High</Badge>;
        case 'medium': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 capitalize">Medium</Badge>;
        default: return <Badge variant="secondary" className="capitalize">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'open': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 capitalize">Open</Badge>;
        case 'in_progress': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 capitalize">In Progress</Badge>;
        case 'resolved': return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 capitalize">Resolved</Badge>;
        default: return <Badge variant="outline" className="capitalize">{status.replace('_', ' ')}</Badge>;
    }
  };

  if (isLoading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-10 w-48" />
              <div className="grid gap-6 md:grid-cols-3">
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
              </div>
              <Skeleton className="h-96 rounded-xl" />
          </div>
      )
  }

  const openTickets = tickets?.filter((t) => t.status === 'open').length || 0;
  const resolvedToday = tickets?.filter((t) => t.status === 'resolved').length || 0; // In real app, filter by date too

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Support Tickets</h1>
          <p className="mt-1 text-muted-foreground">Manage user inquiries and technical issues.</p>
        </div>
        <div className="flex gap-2">
          <Button>Create Ticket</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{openTickets}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-full">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Response Time</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">1.5 hrs</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-full">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{resolvedToday}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <CardTitle className="text-lg font-semibold">All Tickets</CardTitle>
                 <CardDescription>View and manage support requests</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets?.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs text-muted-foreground">{ticket.id.substring(0,8)}</TableCell>
                      <TableCell className="font-medium text-foreground">{ticket.subject}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{ticket.category}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                {ticket.status !== 'resolved' && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, 'resolved')} className="text-emerald-600 dark:text-emerald-400">
                                        Mark Resolved
                                    </DropdownMenuItem>
                                )}
                                {ticket.status !== 'closed' && (
                                    <DropdownMenuItem className="text-destructive">Close Ticket</DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!tickets?.length && (
                      <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              No tickets found.
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
