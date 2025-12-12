'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMessagingStore } from '@/features/messaging';
import { ConversationCard } from '@/features/messaging';
import { ChatHeader } from '@/features/messaging';
import { MessageBubble } from '@/features/messaging';
import { MessageInput } from '@/features/messaging';
import { TypingIndicator } from '@/features/messaging';
import { EmptyState } from '@/features/messaging';
import { ScrollToBottomButton } from '@/features/messaging';
import { PullToRefresh } from '@/features/messaging';
import { useKeyboardHeight } from '@/hooks/use-keyboard';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentMessagesPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard for mobile
  useKeyboardHeight();

  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isLoadingMessages,
    isSending,
    fetchConversations,
    selectConversation,
    sendMessage,
    pinConversation,
    unpinConversation,
    muteConversation,
    unmuteConversation,
    getConversation,
    getMessages,
  } = useMessagingStore();

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle mobile responsive
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom on new messages (only if near bottom)
  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isNearBottom]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    const near = distanceFromBottom < 100;
    setIsNearBottom(near);
    setShowScrollButton(!near && scrollHeight > clientHeight * 1.5);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const activeConversation = activeConversationId ? getConversation(activeConversationId) : null;
  const conversationMessages = activeConversationId ? getMessages(activeConversationId) : [];

  // Sort conversations: pinned → recent
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBack = () => {
    setShowChat(false);
  };

  const handleSendMessage = (content: string) => {
    if (activeConversationId) {
      sendMessage(activeConversationId, content);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    await fetchConversations();
  };

  return (
    <div 
      className="flex bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50"
      style={{ 
        height: 'calc(var(--vh, 1vh) * 100)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Conversations List */}
      <div
        id="conversation-list"
        className={cn(
          'flex w-full flex-col border-r border-border bg-card md:w-[380px] lg:w-[420px]',
          isMobile && showChat && 'hidden'
        )}
      >
        {/* Search Header */}
        <div className="border-b border-border bg-background p-4 pb-safe">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full rounded-full border border-border bg-card px-10 py-2.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 text-foreground"
            />
          </div>
        </div>

        {/* Conversations with Pull-to-Refresh */}
        <div className="flex-1 overflow-y-auto">
          <PullToRefresh onRefresh={handleRefresh}>
            {isLoading ? (
              <div className="flex h-full items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : sortedConversations.length === 0 ? (
              <EmptyState />
            ) : (
              sortedConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  is_active={conversation.id === activeConversationId}
                  onClick={() => handleSelectConversation(conversation.id)}
                  onPin={() =>
                    conversation.isPinned
                      ? unpinConversation(conversation.id)
                      : pinConversation(conversation.id)
                  }
                  onMute={() =>
                    conversation.isMuted
                      ? unmuteConversation(conversation.id)
                      : muteConversation(conversation.id)
                  }
                />
              ))
            )}
          </PullToRefresh>
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          isMobile && !showChat && 'hidden'
        )}
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <ChatHeader
              conversation={activeConversation}
              onBack={handleBack}
              showBackButton={isMobile}
            />

            {/* Messages - WhatsApp/Instagram Background */}
            <div 
              ref={messagesContainerRef}
              className="relative flex-1 overflow-y-auto bg-background px-0 py-4"
              style={{
                WebkitOverflowScrolling: 'touch',
                backgroundImage: `
                  radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.03) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
                `,
              }}
            >
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : conversationMessages.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {conversationMessages.map((message, index) => {
                    const prevMessage = conversationMessages[index - 1];
                    const isGrouped =
                      prevMessage &&
                      prevMessage.senderId === message.senderId &&
                      new Date(message.createdAt).getTime() -
                        new Date(prevMessage.createdAt).getTime() <
                        60000;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.isOwnMessage || false}
                        isGrouped={isGrouped}
                      />
                    );
                  })}
                  
                  {/* Typing Indicator */}
                  {activeConversation.typingUsers.length > 0 && (
                    <TypingIndicator userName={activeConversation.otherParticipant?.name} />
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Floating Scroll Button */}
            <ScrollToBottomButton
              show={showScrollButton}
              onClick={scrollToBottom}
            />

            {/* Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={isSending}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="mb-6 inline-block rounded-full bg-emerald-50 dark:bg-emerald-900/20 p-6 shadow-lg shadow-emerald-500/10">
                <svg
                  className="h-16 w-16 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Select a conversation
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a conversation from the left to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
