"use client";

import React, { useEffect } from 'react';
import { useTechSupportStore } from '@/stores/tech-support.store';
import { ChatInterface } from '@/components/tech-support/chat-interface';

export default function MessagesPage() {
  const { messages, isLoadingMessages, fetchMessages } = useTechSupportStore();

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendMessage = (content: string) => {
    console.log("Sending message:", content);
    // In a real app, this would call an API action
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Communicate directly with users for support.
        </p>
      </div>

      <ChatInterface 
        messages={messages} 
        isLoading={isLoadingMessages} 
        onSendMessage={handleSendMessage} 
      />
    </div>
  );
}
