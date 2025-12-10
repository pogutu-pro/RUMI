"use client";

import * as React from 'react';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  Paperclip,
  Clock,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupportTicket, useAddTicketReply, useUpdateTicketStatus } from '@/hooks/use-support';
import { toast } from 'sonner';

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const router = useRouter();
  const [reply, setReply] = useState('');
  
  const { data: ticket, isLoading } = useSupportTicket(ticketId as string);
  const addReply = useAddTicketReply();
  const updateStatus = useUpdateTicketStatus();

  // Mock messages if not provided by backend on ticket object directly (API usually returns ticket + messages or ticket.messages)
  // Assuming ticket has 'messages' array for now, or we might need separate hook.
  // We'll assume the ticket object contains: subject, description, messages[], status, priority, created_at, user(author).
  
  const messages = (ticket as any)?.messages || [];

  const handleSend = () => {
      if (!reply.trim()) return;
      addReply.mutate({
          ticketId: ticketId as string,
          message: reply,
          isInternal: false
      }, {
          onSuccess: () => {
              setReply('');
              // Scroll to bottom?
          }
      });
  };

  const handleResolve = () => {
      updateStatus.mutate({ id: ticketId as string, status: 'resolved' });
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>;
  if (!ticket) return <div className="p-8">Ticket not found</div>;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                      {ticket.subject}
                      <Badge variant="outline" className="text-xs uppercase font-normal">{ticket.priority}</Badge>
                  </h1>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                      Ticket #{ticket.id.slice(0,8)} • {format(new Date(ticket.created_at), 'MMM dd, HH:mm')}
                  </p>
              </div>
          </div>
          <div className="flex gap-2">
              {ticket.status !== 'resolved' && (
                  <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleResolve}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Resolved
                  </Button>
              )}
          </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col border-none shadow-md overflow-hidden bg-slate-50 dark:bg-slate-900/50">
              <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                      {/* Original Issue */}
                      <div className="flex gap-4">
                          <Avatar className="h-10 w-10 border border-slate-200">
                             <AvatarFallback className="bg-slate-200 text-slate-600">
                                <User className="h-5 w-5" />
                             </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 max-w-[85%]">
                              <div className="flex items-baseline gap-2">
                                  <span className="font-semibold text-sm">Tenant</span>
                                  <span className="text-xs text-slate-400">{format(new Date(ticket.created_at), 'HH:mm')}</span>
                              </div>
                              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none shadow-sm text-sm leading-relaxed border border-slate-100 dark:border-slate-700">
                                  {ticket.description}
                              </div>
                          </div>
                      </div>

                      {/* Messages loop */}
                      {messages.map((msg: any, i: number) => {
                          const isMe = msg.sender_type === 'landlord'; // Adjust based on API
                          return (
                              <div key={i} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                  <Avatar className="h-8 w-8">
                                      <AvatarFallback className={isMe ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200'}>
                                          {isMe ? 'ME' : 'U'}
                                      </AvatarFallback>
                                  </Avatar>
                                   <div className={`space-y-1 max-w-[85%] ${isMe ? 'items-end flex flex-col' : ''}`}>
                                      <div className="flex items-baseline gap-2">
                                          <span className="font-semibold text-xs">{isMe ? 'You' : 'User'}</span>
                                          <span className="text-xs text-slate-400">{msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}</span>
                                      </div>
                                      <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                                          {msg.message}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </ScrollArea>
              
              <div className="p-4 bg-white dark:bg-slate-900 border-t">
                  <div className="flex items-end gap-2">
                       <Button variant="ghost" size="icon" className="shrink-0 text-slate-400">
                          <Paperclip className="h-5 w-5" />
                       </Button>
                       <Textarea 
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Type your reply..." 
                          className="min-h-[50px] max-h-[150px] resize-none border-0 focus-visible:ring-0 bg-slate-50 dark:bg-slate-800 rounded-xl"
                       />
                       <Button 
                          onClick={handleSend} 
                          disabled={!reply.trim() || addReply.isPending}
                          size="icon" 
                          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-10 w-10"
                       >
                           <Send className="h-4 w-4" />
                       </Button>
                  </div>
              </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
              <Card className="border-none shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                      <div className="flex justify-between border-b pb-2">
                          <span className="text-slate-500">Status</span>
                          <Badge variant="secondary" className="capitalize">{ticket.status}</Badge>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                          <span className="text-slate-500">Priority</span>
                          <span className="font-medium capitalize">{ticket.priority}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                          <span className="text-slate-500">Category</span>
                          <span className="font-medium capitalize">{ticket.category}</span>
                      </div>
                       <div className="flex justify-between pb-2">
                          <span className="text-slate-500">Assigned To</span>
                          <span className="font-medium">Unassigned</span>
                      </div>
                  </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/10">
                  <CardContent className="p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                          <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">Response SLA</p>
                          <p className="text-xs text-blue-700 dark:text-blue-400">High priority tickets should be responded to within 4 hours.</p>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}
