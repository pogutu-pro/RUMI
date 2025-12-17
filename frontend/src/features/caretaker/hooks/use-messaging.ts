import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCaretakerConversations,
  getConversationMessages,
  sendCaretakerMessage,
  markConversationAsRead,
  uploadMessageFile,
} from '@/features/caretaker/api/caretaker';
import type { CaretakerMessage } from '@/types/caretaker.types';
import { useToast } from '@/hooks/use-toast';

// 5 minutes stale time for conversations list, but we might want faster updates for chat
export function useCaretakerConversations() {
  return useQuery({
    queryKey: ['caretaker', 'conversations'],
    queryFn: getCaretakerConversations,
    // Poll every 30 seconds for new conversations/unread counts
    refetchInterval: 30000, 
  });
}

export function useCaretakerMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['caretaker', 'conversations', conversationId, 'messages'],
    queryFn: () => getConversationMessages(conversationId!),
    enabled: !!conversationId,
    // Poll fast for messages when chat is open
    refetchInterval: 5000, 
  });
}

export function useSendCaretakerMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ conversationId, content, type = 'text' }: { conversationId: string; content: string; type?: 'text' | 'image' | 'file' }) =>
      sendCaretakerMessage(conversationId, content, type),
    onMutate: async (newMessage) => {
      // Optimistic update could go here, but for now we'll just invalidate
    },
    onSuccess: (data, variables) => {
      // Invalidate specific conversation messages
      queryClient.invalidateQueries({ 
        queryKey: ['caretaker', 'conversations', variables.conversationId, 'messages'] 
      });
      // Invalidate conversations list to update last message/unread
      queryClient.invalidateQueries({ 
        queryKey: ['caretaker', 'conversations'] 
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    },
  });
}

export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => markConversationAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'conversations'] });
      // Also invalidate notifications potentially
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUploadMessageFile() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: uploadMessageFile,
    onError: () => {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload attachment',
        variant: 'destructive',
      });
    },
  });
}
