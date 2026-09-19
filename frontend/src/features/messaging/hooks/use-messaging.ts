'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { messagingApi } from '../api/messaging';

const keys = {
  contacts: ['messaging', 'contacts'] as const,
  conversations: ['messaging', 'conversations'] as const,
  thread: (id: string) => ['messaging', 'thread', id] as const,
  unread: ['messaging', 'unread'] as const,
};

// A chat is only useful if it feels live. The app-wide 5-minute staleTime
// would make replies appear minutes late, so everything here polls.
const LIVE = { staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true } as const;

export const useContacts = () =>
  useQuery({ queryKey: keys.contacts, queryFn: messagingApi.contacts });

export const useConversations = () =>
  useQuery({ queryKey: keys.conversations, queryFn: messagingApi.conversations, refetchInterval: 10_000, ...LIVE });

export const useThread = (conversationId: string | null) =>
  useQuery({
    queryKey: keys.thread(conversationId ?? ''),
    queryFn: () => messagingApi.thread(conversationId as string),
    enabled: !!conversationId,
    refetchInterval: 4_000,
    ...LIVE,
  });

export const useUnreadMessageCount = (enabled = true) =>
  useQuery({
    queryKey: keys.unread,
    queryFn: messagingApi.unreadCount,
    enabled,
    refetchInterval: 20_000,
    ...LIVE,
  });

export const useOpenConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: messagingApi.open,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.conversations }),
    onError: (err) => toast.error((err as { message?: string })?.message || 'Could not start the conversation'),
  });
};

export const useSendMessage = (conversationId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messagingApi.send(conversationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.thread(conversationId) });
      qc.invalidateQueries({ queryKey: keys.conversations });
    },
    onError: (err) => toast.error((err as { message?: string })?.message || 'Message not sent'),
  });
};

export const useMarkConversationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: messagingApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.conversations });
      qc.invalidateQueries({ queryKey: keys.unread });
    },
  });
};
