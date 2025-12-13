import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMockConversations, 
  fetchMockMessages, 
  sendMockMessage, 
  markMockConversationAsRead 
} from '@/lib/mock/mock-messaging';
import { queryKeys } from '@/lib/react-query/query-keys';
import { Message, Conversation } from '@/types/messaging.types';

// Queries
export const useConversations = () => {
  return useQuery({
    queryKey: queryKeys.messaging.conversations,
    queryFn: fetchMockConversations,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: queryKeys.messaging.detail(conversationId || ''),
    queryFn: () => fetchMockMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Mutations
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) => 
      sendMockMessage(conversationId, content),
    onMutate: async ({ conversationId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.messaging.detail(conversationId) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(queryKeys.messaging.detail(conversationId));

      // Optimistic update
      const optimisticMessage: Partial<Message> = {
        id: `temp-${Date.now()}`,
        conversationId,
        content,
        senderId: 'current-user', // Should match mock logic
        senderName: 'You',
        senderRole: 'student',
        status: 'sending',
        createdAt: new Date().toISOString(),
        isOwnMessage: true,
      };

      if (previousMessages) {
        queryClient.setQueryData<Message[]>(queryKeys.messaging.detail(conversationId), [
          ...previousMessages,
          optimisticMessage as Message,
        ]);
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
    mutationFn: markMockConversationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.conversations });
    },
  });
};

// Placeholder mutations for UI interactions
export const usePinConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { /* Mock API call */ },
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
    mutationFn: async (id: string) => { /* Mock API call */ },
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
     mutationFn: async (id: string) => { /* Mock API call */ },
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
     mutationFn: async (id: string) => { /* Mock API call */ },
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
