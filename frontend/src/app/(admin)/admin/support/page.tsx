"use client";

import { useState } from "react";
import { 
  MessageCircle, 
  Search, 
  Filter, 
  CheckCircle2,
  Clock,
  MoreVertical,
  AlertTriangle,
  UserCog,
  ShieldCheck,
  Inbox
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
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useSupportStats, useAdminTickets } from "@/features/admin";

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Using real hooks
  const { data: stats, isLoading: isLoadingStats } = useSupportStats();
  const { data: tickets, isLoading: isLoadingTickets } = useAdminTickets();

  const ticketList = Array.isArray(tickets) ? tickets : (tickets?.results || []);

  if (isLoadingStats || isLoadingTickets) {
      return (
          <div className="space-y-6 p-6">
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

  // Real stats or reasonable fallbacks if endpoint structure varies
  const totalTickets = stats?.total_tickets || ticketList.length || 0;
  const openCount = stats?.open_tickets || ticketList.filter((t: any) => t.status === 'open' || t.status === 'pending').length || 0;
  const resolvedCount = stats?.resolved_tickets || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Support Administration
          </h1>
          <p className="mt-1 text-muted-foreground">Manage support tickets and view system stats.</p>
        </div>
        <div className="flex gap-2">
            <Button>Create Ticket</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-lg transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Inbox className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalTickets}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-lg transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Open / Pending</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{openCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-lg transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{resolvedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <CardTitle className="text-lg font-semibold">Ticket Management</CardTitle>
                 <CardDescription>View and manage all support requests.</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-9 bg-background/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="bg-background/50">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 bg-background/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketList?.length > 0 ? (
                      ticketList.map((ticket: any) => (
                        <TableRow key={ticket.id} className="hover:bg-muted/40">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {ticket.id?.substring(0,8) || ticket.ticket_id}
                          </TableCell>
                          <TableCell className="font-medium">{ticket.subject || ticket.title}</TableCell>
                          <TableCell className="text-muted-foreground capitalize">{ticket.category || 'General'}</TableCell>
                          <TableCell>
                             <Badge variant="outline" className={cn("capitalize", 
                                 ticket.priority === 'urgent' ? "text-red-500 border-red-500/20 bg-red-500/10" : 
                                 ticket.priority === 'high' ? "text-orange-500 border-orange-500/20 bg-orange-500/10" : ""
                             )}>
                                {ticket.priority || 'Low'}
                             </Badge>
                          </TableCell>
                          <TableCell>
                             <Badge variant={ticket.status === 'resolved' ? "default" : "secondary"} className="capitalize">
                                {ticket.status || 'open'}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {ticket.created_at ? format(new Date(ticket.created_at), 'MMM d, yyyy') : '-'}
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
                                    <DropdownMenuItem>Assign to Tech Support</DropdownMenuItem>
                                    <DropdownMenuItem className="text-emerald-600">Mark Resolved</DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                       <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
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
