'use client';

import * as React from 'react';
import { MessageSquare, Search, Send, Paperclip } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { getInitials } from '@/lib/utils/caretaker-helpers';

export default function Page() {
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>('1');
  const [message, setMessage] = React.useState('');

  const conversations = [
    {
      id: '1',
      name: 'Alice Johnson',
      roomNumber: '204',
      lastMessage: 'Thank you for fixing the issue!',
      timestamp: '10:30 AM',
      unread: 0,
      avatar: '',
    },
    {
      id: '2',
      name: 'Bob Williams',
      roomNumber: '315',
      lastMessage: 'When will the maintenance be completed?',
      timestamp: 'Yesterday',
      unread: 2,
      avatar: '',
    },
  ];

  const messages = selectedConversation === '1' ? [
    {
      id: '1',
      sender: 'student',
      text: 'Hi, the AC in my room is making strange noises',
      timestamp: '9:15 AM',
    },
    {
      id: '2',
      sender: 'caretaker',
      text: 'I\'ll send someone to check it out within the hour',
      timestamp: '9:20 AM',
    },
    {
      id: '3',
      sender: 'student',
      text: 'Thank you for fixing the issue!',
      timestamp: '10:30 AM',
    },
  ] : [];

  const handleSend = () => {
    if (message.trim()) {
      // Handle send logic
      setMessage('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Messages
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Communicate with students about requests and issues
        </p>
      </div>

      <div className="grid md:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search messages..." className="pl-10" />
              </div>

              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.id
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarImage src={conv.avatar} />
                          <AvatarFallback>{getInitials(conv.name.split(' ')[0], conv.name.split(' ')[1])}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <p className="font-medium text-sm truncate">{conv.name}</p>
                              <p className="text-xs text-muted-foreground">Room {conv.roomNumber}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                            {conv.unread > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 ml-2">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        {selectedConversation ? (
          <Card>
            <CardContent className="p-0 flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Alice Johnson</p>
                    <p className="text-xs text-muted-foreground">Room 204</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'caretaker' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender === 'caretaker'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'caretaker' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[44px] max-h-[120px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button onClick={handleSend} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
