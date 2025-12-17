import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { Message, Conversation, SendMessageRequest } from '../types';

// Queries
export const useConversations = () => {
  return useQuery({
    queryKey: queryKeys.messaging.conversations(),
    queryFn: async () => {
      try {
        const response = await messagesApi.getConversations();
        return response.data;
      } catch (error) {
        console.warn('Failed to fetch conversations (Endpoint might be missing)', error);
        return { 
          data: [], 
          current_page: 1, 
          total_pages: 1, 
          count: 0, 
          next: null, 
          previous: null 
        };
      }
    },
    staleTime: 1000 * 60,
  });
};

export const useMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: queryKeys.messaging.detail(conversationId || ''),
    queryFn: async () => {
      if (!conversationId) return { data: [], current_page: 1, total_pages: 1, count: 0 };
      try {
        const response = await messagesApi.getMessages(conversationId);
        return response.data;
      } catch (error) {
        console.warn('Failed to fetch messages (Endpoint might be missing)', error);
        return { data: [], current_page: 1, total_pages: 1, count: 0 };
      }
    },
    enabled: !!conversationId,
    staleTime: 1000 * 30,
  });
};

// Mutations
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content, attachments }: { conversationId: string; content: string; attachments?: File[] }) => {
        // Prepare request data
        const reqData: SendMessageRequest = { content };
        // Note: Attachment handling would normally go here or in a separate call
        return messagesApi.sendMessage(conversationId, reqData);
    },
    onMutate: async ({ conversationId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.messaging.detail(conversationId) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<PaginatedResponse<Message>>(queryKeys.messaging.detail(conversationId));

      // Optimistic update
      const optimisticMessage: Partial<Message> = {
        id: `temp-${Date.now()}`,
        conversationId,
        content,
        senderId: 'current-user',
        senderName: 'You',
        senderRole: 'student',
        status: 'sending',
        createdAt: new Date().toISOString(),
        isOwnMessage: true,
        attachments: [],
        readBy: []
      };

      if (previousMessages) {
        queryClient.setQueryData<PaginatedResponse<Message>>(queryKeys.messaging.detail(conversationId), {
          ...previousMessages,
          data: [...previousMessages.data, optimisticMessage as Message]
        });
      }

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.messaging.detail(variables.conversationId), context.previousMessages);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.detail(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.conversations });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => messagesApi.markConversationAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.conversations });
    },
  });
};

// Placeholder mutations for UI interactions (Pending backend implementation)
export const usePinConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => messagesApi.pinConversation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messaging.conversations });
      const previous = queryClient.getQueryData<Conversation[]>(queryKeys.messaging.conversations);
      if (previous) {
        queryClient.setQueryData(queryKeys.messaging.conversations, previous.map(c => 
          c.id === id ? { ...c, isPinned: true } : c
        ));
      }
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.messaging.conversations, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.messaging.conversations }),
  });
};

export const useUnpinConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => messagesApi.unpinConversation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messaging.conversations });
      const previous = queryClient.getQueryData<Conversation[]>(queryKeys.messaging.conversations);
      if (previous) {
        queryClient.setQueryData(queryKeys.messaging.conversations, previous.map(c => 
          c.id === id ? { ...c, isPinned: false } : c
        ));
      }
      return { previous };
    },
    onError: (err, id, context) => {
       if (context?.previous) queryClient.setQueryData(queryKeys.messaging.conversations, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.messaging.conversations }),
  });
};

export const useMuteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
     mutationFn: (id: string) => messagesApi.muteConversation(id),
     onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messaging.conversations });
      const previous = queryClient.getQueryData<Conversation[]>(queryKeys.messaging.conversations);
      if (previous) {
        queryClient.setQueryData(queryKeys.messaging.conversations, previous.map(c => 
          c.id === id ? { ...c, isMuted: true } : c
        ));
      }
      return { previous };
    },
  });
};

export const useUnmuteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
     mutationFn: (id: string) => messagesApi.unmuteConversation(id),
     onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messaging.conversations });
      const previous = queryClient.getQueryData<Conversation[]>(queryKeys.messaging.conversations);
      if (previous) {
        queryClient.setQueryData(queryKeys.messaging.conversations, previous.map(c => 
          c.id === id ? { ...c, isMuted: false } : c
        ));
      }
      return { previous };
    },
  });
};
