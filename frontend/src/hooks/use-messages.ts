import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/features/messaging';
import { toast } from 'sonner';
import type {
  SendMessageRequest,
  CreateConversationRequest,
  GetMessagesParams,
  GetConversationsParams,
} from '@/features/messaging';

/**
 * Hook to fetch all conversations
 * @param params - Query parameters for filtering/pagination
 * @returns Query result with conversations data
 */
export const useConversations = (params?: GetConversationsParams) => {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: () => messagesApi.getConversations(params),
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to fetch a single conversation
 * @param conversationId - The ID of the conversation
 * @returns Query result with conversation data
 */
export const useConversation = (conversationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return messagesApi.getConversation(conversationId);
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to fetch messages for a conversation
 * @param conversationId - The ID of the conversation
 * @param params - Query parameters for pagination
 * @returns Query result with messages data
 */
export const useMessages = (
  conversationId: string | null | undefined,
  params?: GetMessagesParams
) => {
  return useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return messagesApi.getMessages(conversationId, params);
    },
    enabled: !!conversationId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 10, // Refetch every 10 seconds for real-time feel
  });
};

/**
 * Hook to send a message
 * @param conversationId - The ID of the conversation
 * @returns Mutation for sending a message
 */
export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) =>
      messagesApi.sendMessage(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to send message';
      toast.error(message);
    },
  });
};

/**
 * Hook to mark a message as read
 * @param conversationId - The ID of the conversation
 * @returns Mutation for marking message as read
 */
export const useMarkMessageAsRead = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      messagesApi.markMessageAsRead(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId]});
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
    },
  });
};

/**
 * Hook to mark all messages in a conversation as read
 * @param conversationId - The ID of the conversation
 * @returns Mutation for marking conversation as read
 */
export const useMarkConversationAsRead = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => messagesApi.markConversationAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
      toast.success('Conversation marked as read');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to mark as read';
      toast.error(message);
    },
  });
};

/**
 * Hook to create a new conversation
 * @returns Mutation for creating a conversation
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) =>
      messagesApi.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation created');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create conversation';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a conversation
 * @returns Mutation for deleting a conversation
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagesApi.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete conversation';
      toast.error(message);
    },
  });
};

/**
 * Hook to get unread message count
 * @returns Query result with unread count
 */
export const useUnreadMessagesCount = () => {
  return useQuery({
    queryKey: ['unreadMessagesCount'],
    queryFn: () => messagesApi.getUnreadCount(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
};
