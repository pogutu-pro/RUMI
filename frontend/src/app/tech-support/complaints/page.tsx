"use client";

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  MessageSquare,
  CheckCircle2,
  UserPlus,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useTechSupportStore } from '@/features/support';
import { useSupportTickets } from '@/features/support/hooks/use-support';
import { ComplaintTable } from '@/features/support';
import { TicketDetailDialog } from '@/features/support';
import { TechSupportTicket } from '@/features/support';
import { Badge } from '@/components/ui/badge';

export default function ComplaintsPage() {
  const { data: tickets = [], isLoading: isLoadingTickets } = useSupportTickets();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TechSupportTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredTickets = tickets.filter(tkt => 
    tkt.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tkt.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tkt.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = (ticketId: string) => {
    console.log("Assign ticket", ticketId);
  };

  const handleEscalate = (ticketId: string) => {
    console.log("Escalate ticket", ticketId);
    setIsDetailOpen(false);
  };

  const handleResolve = (ticketId: string) => {
    console.log("Resolve ticket", ticketId);
    setIsDetailOpen(false);
  };

  const handleView = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setIsDetailOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Complaints & Issues
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and resolve user support tickets efficiently.
          </p>
        </div>
        <Button className="shadow-lg shadow-primary/20">
          <UserPlus className="mr-2 h-4 w-4" />
          Auto-Assign Next
        </Button>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="open">Open (3)</TabsTrigger>
          <TabsTrigger value="my_tickets">Assign to Me</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="open" className="mt-6 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                   <CardTitle>Ticket Queue</CardTitle>
                   <CardDescription>
                     All unassigned and open tickets requiring attention.
                   </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  Filter View
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search query, user, or Ticket ID..." 
                    className="pl-9 bg-background/50 border-input/60 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              <ComplaintTable 
                tickets={filteredTickets}
                isLoading={isLoadingTickets}
                onAssign={handleAssign}
                onEscalate={handleEscalate}
                onView={handleView}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my_tickets">
           <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed border-muted/50 hover:bg-muted/20 transition-colors">
            <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
               <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No Assigned Tickets</h3>
            <p className="max-w-sm mt-2">You have not assigned any tickets to yourself yet. Pick one from the Open Queue to get started.</p>
            <Button variant="link" className="mt-4">Go to Queue</Button>
          </div>
        </TabsContent>

        <TabsContent value="resolved">
           <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed border-muted/50 hover:bg-muted/20 transition-colors">
             <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
             </div>
            <h3 className="text-lg font-medium text-foreground">No Resolved Tickets</h3>
            <p className="max-w-sm mt-2">Tickets you successfully resolve will be archived here for future reference.</p>
          </div>
        </TabsContent>
      </Tabs>

      <TicketDetailDialog 
        ticket={selectedTicket}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onResolve={handleResolve}
        onEscalate={handleEscalate}
      />
    </div>
  );
}
