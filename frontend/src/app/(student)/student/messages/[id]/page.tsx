'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft, Paperclip } from 'lucide-react';

export default function ConversationPage() {
  const params = useParams();
  const [message, setMessage] = React.useState('');

  // TODO: Fetch from API
  const conversation = {
    id: params.id,
    participant: 'Caretaker - John Doe',
    messages: [
      {
        id: '1',
        sender: 'them',
        content: 'Hello! How can I help you today?',
        timestamp: '2024-01-28T10:00:00',
      },
      {
        id: '2',
        sender: 'me',
        content: 'Hi, I wanted to report a maintenance issue in my room.',
        timestamp: '2024-01-28T10:05:00',
      },
      {
        id: '3',
        sender: 'them',
        content: 'Thank you for reporting. Can you provide more details about the issue?',
        timestamp: '2024-01-28T10:10:00',
      },
    ],
  };

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Send message via API
      console.log('Sending:', message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/student/messages">
          <Button variant="ghost" size="sm" className="dark:border-gray-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {conversation.participant}
          </h1>
        </div>
      </div>

      {/* Messages Container */}
      <Card className="flex-1 flex flex-col bg-card overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className={msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                  {msg.sender === 'me' ? 'ME' : 'JD'}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    msg.sender === 'me'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="bg-background"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
