'use client';

import { useState } from 'react';
import {
  MessageCircle,
  Search,
  Filter,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSupportTickets, useUpdateTicketStatus } from '@/hooks/use-support';
import { SupportTicket } from '@/types/entities.types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

export default function Page() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: tickets, isLoading } = useSupportTickets();
  const updateStatus = useUpdateTicketStatus();

  const handleStatusChange = (id: string, status: SupportTicket['status']) => {
    updateStatus.mutate({ id, status });
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <Badge className={styles[priority as keyof typeof styles]}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-blue-100 text-blue-700 border-blue-200',
      in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
      resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      closed: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Thinking...</div>;
  }

  const openTickets = tickets?.filter((t) => t.status === 'open').length || 0;
  const resolvedToday =
    tickets?.filter((t) => t.status === 'resolved').length || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Support Tickets
          </h1>
          <p className="mt-2 text-slate-500">
            Manage user inquiries and technical issues.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Create Ticket
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Open Tickets</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {openTickets}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Avg. Response Time
              </p>
              <h3 className="text-2xl font-bold text-slate-900">1.5 hrs</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Resolved Today
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {resolvedToday}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              All Tickets
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
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
                  <TableRow key={ticket.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">
                      {ticket.id}
                    </TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell className="capitalize">
                      {ticket.category}
                    </TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(ticket.id, 'resolved')
                        }
                        disabled={ticket.status === 'resolved'}
                      >
                        Mark Resolved
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
