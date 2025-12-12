"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Send, 
  MoreVertical,
  Phone,
  Video,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TechSupportMessage } from '@/features/support';

interface ChatInterfaceProps {
  messages: TechSupportMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}

export function ChatInterface({ messages, isLoading, onSendMessage }: ChatInterfaceProps) {
  const [selectedUser, setSelectedUser] = useState("Alice Johnson");
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex h-[600px] w-full border rounded-lg overflow-hidden bg-white dark:bg-slate-950">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input placeholder="Search messages..." className="pl-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {["Alice Johnson", "Bob Smith", "David Wilson"].map((user, i) => (
              <button
                key={i}
                className={`flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${selectedUser === user ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <Avatar>
                  <AvatarFallback>{user[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{user}</span>
                    <span className="text-xs text-slate-500">10:30 AM</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {i === 0 ? "I cannot access my account..." : "Thanks for your help!"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{selectedUser[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedUser}</h3>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="block h-2 w-2 rounded-full bg-green-600" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'Support' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] rounded-lg p-3 text-sm ${
                    msg.sender === 'Support' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${msg.sender === 'Support' ? 'text-blue-100' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input 
              placeholder="Type a message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
