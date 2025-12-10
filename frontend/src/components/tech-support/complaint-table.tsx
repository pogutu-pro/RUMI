"use client";

import React from 'react';
import { 
  MoreHorizontal, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
  ArrowUpCircle
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TechSupportTicket } from '@/lib/api/tech-support';

interface ComplaintTableProps {
  tickets: TechSupportTicket[];
  isLoading: boolean;
  onAssign: (ticketId: string) => void;
  onEscalate: (ticketId: string) => void;
  onView: (ticketId: string) => void;
}

export function ComplaintTable({ tickets, isLoading, onAssign, onEscalate, onView }: ComplaintTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading tickets...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((tkt) => (
            <TableRow key={tkt.id}>
              <TableCell className="font-mono text-xs">{tkt.id}</TableCell>
              <TableCell className="font-medium">{tkt.subject}</TableCell>
              <TableCell>{tkt.user_name}</TableCell>
              <TableCell>
                <Badge variant="outline">{tkt.category}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={
                  tkt.priority === 'critical' ? "bg-red-100 text-red-700 hover:bg-red-100" :
                  tkt.priority === 'high' ? "bg-orange-100 text-orange-700 hover:bg-orange-100" :
                  "bg-blue-100 text-blue-700 hover:bg-blue-100"
                }>
                  {tkt.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {tkt.status === 'open' && <AlertCircle className="h-3.5 w-3.5 text-blue-500" />}
                  {tkt.status === 'in_progress' && <Clock className="h-3.5 w-3.5 text-orange-500" />}
                  {tkt.status === 'resolved' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                  <span className="text-sm capitalize">{tkt.status.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-500 text-xs">{tkt.created_at}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(tkt.id)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View & Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAssign(tkt.id)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign to Me
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-orange-600" onClick={() => onEscalate(tkt.id)}>
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Escalate to SuperAdmin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
