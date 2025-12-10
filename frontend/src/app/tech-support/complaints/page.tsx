"use client";

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  MessageSquare,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTechSupportStore } from '@/stores/tech-support.store';
import { ComplaintTable } from '@/components/tech-support/complaint-table';
import { TicketDetailDialog } from '@/components/tech-support/ticket-detail-dialog';
import { TechSupportTicket } from '@/lib/api/tech-support';

export default function ComplaintsPage() {
  const { tickets, isLoadingTickets, fetchTickets } = useTechSupportStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TechSupportTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Complaints & Issues</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage and resolve user support tickets.
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign to Me
        </Button>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">Open Tickets</TabsTrigger>
          <TabsTrigger value="my_tickets">Assigned to Me</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="open" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Ticket Queue</CardTitle>
              <CardDescription>
                All unassigned and open tickets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Search subject, user, or ID..." 
                    className="pl-9"
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
           <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-lg font-medium text-slate-900">No Assigned Tickets</h3>
            <p>You have not assigned any tickets to yourself yet.</p>
          </div>
        </TabsContent>

        <TabsContent value="resolved">
           <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-lg font-medium text-slate-900">No Resolved Tickets</h3>
            <p>Tickets you resolve will appear here.</p>
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
