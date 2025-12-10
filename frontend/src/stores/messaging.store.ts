import { create } from 'zustand';
import type { MessagingState } from '@/types/messaging.types';
import type { ID } from '@/types/auth.types';
import {
  fetchMockConversations,
  fetchMockMessages,
  sendMockMessage,
  markMockConversationAsRead,
} from '@/lib/mock/mock-messaging';

/**
 * Messaging Store (Zustand)
 * NOTE: Currently using mock data. Backend integration will replace mock functions.
 */
export const useMessagingStore = create<MessagingState>((set, get) => ({
  // =========================================================================
  // STATE
  // =========================================================================
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingIndicators: {},
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  searchQuery: '',
  filter: 'all',
  showConversationInfo: false,

  // =========================================================================
  // CONVERSATION ACTIONS
  // =========================================================================

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = await fetchMockConversations();
      set({ conversations, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      set({ isLoading: false });
    }
  },

  selectConversation: async (conversationId: ID) => {
    set({ activeConversationId: conversationId, isLoadingMessages: true });

    // Fetch messages if not already loaded
    const { messages } = get();
    if (!messages[conversationId]) {
      try {
        const conversationMessages = await fetchMockMessages(conversationId);
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: conversationMessages,
          },
          isLoadingMessages: false,
        }));
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        set({ isLoadingMessages: false });
      }
    } else {
      set({ isLoadingMessages: false });
    }

    // Mark as read
    await get().markAsRead(conversationId);
  },

  pinConversation: async (conversationId: ID) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: true } : conv
      ),
    }));
    // TODO: API call to persist pin status
  },

  unpinConversation: async (conversationId: ID) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: false } : conv
      ),
    }));
    // TODO: API call to persist pin status
  },

  muteConversation: async (conversationId: ID) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isMuted: true } : conv
      ),
    }));
    // TODO: API call to persist mute status
  },

  unmuteConversation: async (conversationId: ID) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isMuted: false } : conv
      ),
    }));
    // TODO: API call to persist mute status
  },

  deleteConversation: async (conversationId: ID) => {
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== conversationId),
      activeConversationId:
        state.activeConversationId === conversationId ? null : state.activeConversationId,
    }));
    // TODO: API call to delete conversation
  },

  // =========================================================================
  // MESSAGE ACTIONS
  // =========================================================================

  fetchMessages: async (conversationId: ID) => {
    set({ isLoadingMessages: true });
    try {
      const conversationMessages = await fetchMockMessages(conversationId);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: conversationMessages,
        },
        isLoadingMessages: false,
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId: ID, content: string) => {
    if (!content.trim()) return;

    set({ isSending: true });

    // Optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: 'current-user', // Replace with actual user ID
      senderName: 'You',
      senderRole: 'student' as const,
      content,
      messageType: 'text' as const,
      attachments: [],
      status: 'sending' as const,
      readBy: [],
      createdAt: new Date().toISOString(),
      isOwnMessage: true,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), tempMessage],
      },
    }));

    try {
      const sentMessage = await sendMockMessage(conversationId, content);

      // Replace temp message with actual message
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map((msg) =>
            msg.id === tempMessage.id ? { ...sentMessage, isOwnMessage: true } : msg
          ),
        },
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessage: sentMessage, updatedAt: sentMessage.createdAt }
            : conv
        ),
        isSending: false,
      }));
    } catch (error) {
      console.error('Failed to send message:', error);

      // Mark as failed
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map((msg) =>
            msg.id === tempMessage.id ? { ...msg, status: 'failed' as const } : msg
          ),
        },
        isSending: false,
      }));
    }
  },

  sendAttachment: async (conversationId: ID, file: File) => {
    // TODO: Implement file upload with compression
    console.log('Upload file:', file);
  },

  markAsRead: async (conversationId: ID) => {
    try {
      await markMockConversationAsRead(conversationId);

      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  editMessage: async (messageId: ID, content: string) => {
    // TODO: Implement message editing
    console.log('Edit message:', messageId, content);
  },

  deleteMessage: async (messageId: ID) => {
    // TODO: Implement message deletion
    console.log('Delete message:', messageId);
  },

  // =========================================================================
  // SEARCH & FILTER
  // =========================================================================

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilter: (filter: 'all' | 'unread' | 'pinned') => {
    set({ filter });
  },

  searchMessages: async (query: string) => {
    // TODO: Implement full-text search
    return [];
  },

  // =========================================================================
  // UI ACTIONS
  // =========================================================================

  toggleConversationInfo: () => {
    set((state) => ({ showConversationInfo: !state.showConversationInfo }));
  },

  setTyping: (conversationId: ID, isTyping: boolean) => {
    // TODO: Send typing indicator to backend
    console.log('Typing:', conversationId, isTyping);
  },

  // =========================================================================
  // HELPERS
  // =========================================================================

  getUnreadCount: () => {
    const { conversations } = get();
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  },

  getConversation: (conversationId: ID) => {
    const { conversations } = get();
    return conversations.find((conv) => conv.id === conversationId);
  },

  getMessages: (conversationId: ID) => {
    const { messages } = get();
    return messages[conversationId] || [];
  },
}));
