"use client";

import * as React from 'react';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon, 
  Paperclip, 
  User, 
  ArrowLeft 
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';
import { 
  useCaretakerConversations, 
  useCaretakerMessages, 
  useSendCaretakerMessage, 
  useMarkConversationAsRead 
} from '@/features/caretaker';
import { CaretakerConversation, CaretakerMessage } from '@/types/caretaker.types';
import { getUserInitials } from '@/lib/utils/user';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);
  const [messageInput, setMessageInput] = React.useState('');
  const [isMobileView, setIsMobileView] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Queries
  const { data: conversations = [], isLoading: loadingConversations } = useCaretakerConversations();
  const { data: messages = [], isLoading: loadingMessages } = useCaretakerMessages(selectedConversation);
  
  // Mutations
  const sendMessageMutation = useSendCaretakerMessage();
  const markReadMutation = useMarkConversationAsRead();

  // Effects
  React.useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedConversation]);

  React.useEffect(() => {
    // Mark as read when opening conversation
    if (selectedConversation) {
      const convo = conversations.find(c => c.id === selectedConversation);
      if (convo && convo.unreadCount > 0) {
        markReadMutation.mutate(selectedConversation);
      }
    }
  }, [selectedConversation, conversations, markReadMutation]);

  // Handle Mobile/Desktop View
  React.useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageInput,
    });
    setMessageInput('');
  };

  const activeConversation = conversations.find(c => c.id === selectedConversation);

  // Layout Logic
  const showList = !isMobileView || !selectedConversation;
  const showChat = !isMobileView || selectedConversation;

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-0 lg:gap-4 animate-in fade-in duration-500 overflow-hidden pb-2">
      
      {/* Conversation List */}
      {showList && (
        <Card className={cn(
          "flex flex-col border-r lg:border border-y-0 lg:border-y shadow-none lg:shadow-sm rounded-none lg:rounded-xl h-full",
          isMobileView ? "w-full" : "w-80 lg:w-96"
        )}>
          <div className="p-4 border-b bg-muted/20">
            <h2 className="font-bold text-xl mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-9 bg-background" />
            </div>
          </div>
          <ScrollArea className="flex-1 h-[calc(100%-120px)]">
            <div className="flex flex-col p-0 gap-0 divide-y">
              {loadingConversations ? (
                <p className="p-4 text-center text-muted-foreground text-sm">Loading conversations...</p>
              ) : conversations.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground text-sm">No conversations yet</p>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo.id)}
                    className={cn(
                      "flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 w-full",
                      selectedConversation === convo.id && "bg-muted/50 border-l-4 border-l-primary"
                    )}
                  >
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={convo.participantAvatar} />
                      <AvatarFallback>{getUserInitials(convo.participantName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold truncate text-sm">{convo.participantName}</span>
                        {convo.lastMessage && (
                           <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                             {new Date(convo.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        convo.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {convo.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                    {convo.unreadCount > 0 && (
                      <Badge variant="default" className="h-5 min-w-[1.25rem] rounded-full p-0 flex items-center justify-center text-[10px]">
                        {convo.unreadCount}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Active Chat Area */}
      {showChat && (
        <Card className="flex-1 flex flex-col border-none lg:border shadow-none lg:shadow-sm h-full rounded-none lg:rounded-xl overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-background flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  {isMobileView && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)} className="mr-1">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activeConversation?.participantAvatar} />
                    <AvatarFallback>{getUserInitials(activeConversation?.participantName || "?")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{activeConversation?.participantName}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {activeConversation?.participantType} • {activeConversation?.roomNumber ? `Room ${activeConversation.roomNumber}` : 'Online'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                   {/* Actions for future (Call/Video) */}
                   <Button variant="ghost" size="icon" disabled><Phone className="h-4 w-4" /></Button>
                   <Button variant="ghost" size="icon" disabled><Video className="h-4 w-4" /></Button>
                   <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center p-8"><span className="loading loading-dots" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm my-auto pt-20">
                     <p>Start a conversation with {activeConversation?.participantName}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderType === 'caretaker';
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex max-w-[80%]",
                          isMe ? "ml-auto" : "mr-auto"
                        )}
                      >
                         <div className={cn(
                           "rounded-2xl px-4 py-2 text-sm shadow-sm",
                           isMe 
                             ? "bg-primary text-primary-foreground rounded-tr-none" 
                             : "bg-background border rounded-tl-none"
                         )}>
                            {msg.content}
                            <span className={cn(
                              "text-[10px] block text-right mt-1 opacity-70",
                              isMe ? "text-primary-foreground" : "text-muted-foreground"
                            )}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-background border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..." 
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" size="icon" disabled={!messageInput.trim() || sendMessageMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
               <div className="bg-muted/50 p-4 rounded-full mb-4">
                  <User className="h-8 w-8 opacity-50" />
               </div>
               <h3 className="font-semibold text-lg">Select a conversation</h3>
               <p className="text-sm">Choose a chat from the list to start messaging.</p>
             </div>
          )}
        </Card>
      )}
    </div>
  );
}
