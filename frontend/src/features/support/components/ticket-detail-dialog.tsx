"use client";

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send,
  ArrowUpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TechSupportTicket } from '@/features/support';
import { useTicketReplies, useAddTicketReply } from '../hooks/use-support';
import { formatDistanceToNow } from 'date-fns';

interface TicketDetailDialogProps {
  ticket: TechSupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (ticketId: string) => void;
  onEscalate: (ticketId: string) => void;
}

export function TicketDetailDialog({ ticket, isOpen, onClose, onResolve, onEscalate }: TicketDetailDialogProps) {
  const [reply, setReply] = useState("");
  const { data: replies, isLoading } = useTicketReplies(ticket?.id || "");
  const { mutate: sendReply, isPending } = useAddTicketReply();

  if (!ticket) return null;

  const handleSendReply = () => {
    if (!reply.trim()) return;
    
    sendReply({ ticketId: ticket.id, message: reply }, {
        onSuccess: () => setReply("")
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{ticket.subject}</DialogTitle>
            <Badge variant="outline">{ticket.id}</Badge>
          </div>
          <DialogDescription className="flex items-center gap-4 pt-2">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{ticket.user_name}</span>
            </span>
            <span className="text-slate-300">|</span>
            <Badge variant="secondary" className={
              ticket.priority === 'critical' ? "bg-red-100 text-red-700" :
              ticket.priority === 'high' ? "bg-orange-100 text-orange-700" :
              "bg-blue-100 text-blue-700"
            }>
              {ticket.priority} Priority
            </Badge>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-sm">
              {ticket.status === 'open' && <AlertCircle className="h-3.5 w-3.5 text-blue-500" />}
              {ticket.status === 'in_progress' && <Clock className="h-3.5 w-3.5 text-orange-500" />}
              {ticket.status === 'resolved' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
              <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50">
            <h4 className="text-sm font-medium mb-2 text-slate-500">Description</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              User is reporting an issue regarding {ticket.category.toLowerCase()}. 
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-500">Discussion</h4>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground text-center">Loading discussion...</p>
                ) : replies && replies.length > 0 ? (
                    replies.map((msg: any) => (
                        <div key={msg.id} className={`flex flex-col gap-1 ${msg.isInternal ? 'items-end' : 'items-start'}`}>
                            <div className={`${msg.isInternal ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border'} rounded-lg p-3 max-w-[80%] text-sm`}>
                                {msg.message || msg.content}
                            </div>
                            <span className="text-xs text-slate-400 px-1">
                                {msg.isInternal ? 'Support Agent' : ticket.user_name} • {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'Just now'}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center">No messages yet.</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2">
            <Textarea 
              placeholder="Type your reply..." 
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-[80px]"
            />
            <Button size="icon" className="h-[80px] w-[80px]" onClick={handleSendReply} disabled={isPending}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" onClick={() => onEscalate(ticket.id)}>
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Escalate
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onResolve(ticket.id)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Resolved
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

