"use client";

import React, { useEffect } from 'react';
// import { useTechSupportStore } from '@/features/support';
import { useSupportMessages } from '@/features/support/hooks/use-support';
import { ChatInterface } from '@/features/support';
import { MessageSquare, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MessagesPage() {
  const { data: response, isLoading: isLoadingMessages } = useSupportMessages();
  const messages = response?.data || [];

  const handleSendMessage = (content: string) => {
    console.log("Sending message:", content);
    // In a real app, this would call an API action
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
           <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
             Messages
           </h1>
           <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-normal">
             Beta
           </Badge>
        </div>
        <p className="text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Direct communication channel with users.
        </p>
      </div>

      <div className="flex-1 min-h-0 border rounded-xl shadow-sm bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col">
        <ChatInterface 
          messages={messages} 
          isLoading={isLoadingMessages} 
          onSendMessage={handleSendMessage} 
        />
      </div>
    </div>
  );
}
