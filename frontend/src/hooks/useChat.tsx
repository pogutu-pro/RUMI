import { useState, useEffect, useCallback } from 'react';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  name: string;
  avatar?: string;
  is_online?: boolean;
  last_seen?: string;
}

interface Message {
  id: number;
  sender: User;
  message: string;
  timestamp: string;
  is_read: boolean;
}

interface Conversation {
  id: number;
  other_user: User;
  last_message: Message | null;
  unread_count: number;
  updated_at: string;
}

interface UseChatReturn {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  sendMessage: (message: string) => Promise<void>;
  clearError: () => void;
}

export const useChat = (): UseChatReturn => {
  const { isAuthenticated, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setError('Please login to access chat');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await marketplaceAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      const response = await marketplaceAPI.getConversationMessages(conversationId.toString());
      setMessages(response.data.messages || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  }, []);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages([]);
    fetchMessages(conversation.id);
  }, [fetchMessages]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!currentConversation) {
      setError('No conversation selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await marketplaceAPI.sendMessage(currentConversation.id.toString(), { message: messageText });

      // Refresh messages after sending
      await fetchMessages(currentConversation.id);

      // Refresh conversations to update last message
      await fetchConversations();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentConversation, fetchMessages, fetchConversations]);

  // Polling for new messages when conversation is selected
  useEffect(() => {
    if (!currentConversation) return;

    const pollInterval = setInterval(() => {
      fetchMessages(currentConversation.id);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [currentConversation, fetchMessages]);

  // Initial fetch of conversations
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user, fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    fetchConversations,
    selectConversation,
    sendMessage,
    clearError,
  };
};

export type { Conversation, Message, User };