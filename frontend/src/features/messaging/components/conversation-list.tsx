'use client';

import { useConversations } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectConversation?: (conversationId: string) => void;
  selectedId?: string;
}

export function ConversationList({ onSelectConversation, selectedId }: ConversationListProps) {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2 p-4">
        {conversations?.results.map((conversation) => {
          const isSelected = selectedId === conversation.id;
          const lastMessage = conversation.lastMessage;

          return (
            <div
              key={conversation.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-primary/10' : 'hover:bg-muted'
              }`}
              onClick={() => onSelectConversation?.(conversation.id)}
            >
              <Avatar>
                <AvatarImage src={conversation.otherUser?.avatar} />
                <AvatarFallback>{conversation.otherUser?.name?.[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium truncate">{conversation.otherUser?.name}</p>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {lastMessage.content}
                  </p>
                )}
              </div>

              {conversation.unreadCount > 0 && (
                <Badge variant="default" className="ml-auto">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          );
        })}

        {conversations?.results.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No conversations yet
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
