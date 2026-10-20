import { axiosInstance as axios } from '@/lib/api/client';
import type { ChatMessage, ChatPerson, Conversation, Thread } from '../types';

export const messagingApi = {
  contacts: async (): Promise<ChatPerson[]> => {
    const res = await axios.get<{ results: ChatPerson[] }>('/messaging/contacts/');
    return res.data.results;
  },
  conversations: async (): Promise<Conversation[]> => {
    const res = await axios.get<{ results: Conversation[] }>('/messaging/conversations/');
    return res.data.results;
  },
  open: async (recipientId: number): Promise<Conversation> => {
    const res = await axios.post<Conversation>('/messaging/conversations/', { recipient: recipientId });
    return res.data;
  },
  thread: async (conversationId: string): Promise<Thread> => {
    const res = await axios.get<Thread>(`/messaging/conversations/${conversationId}/messages/`);
    return res.data;
  },
  send: async (conversationId: string, body: string): Promise<ChatMessage> => {
    const res = await axios.post<ChatMessage>(`/messaging/conversations/${conversationId}/messages/`, { body });
    return res.data;
  },
  markRead: async (conversationId: string): Promise<void> => {
    await axios.post(`/messaging/conversations/${conversationId}/read/`);
  },
  unreadCount: async (): Promise<number> => {
    const res = await axios.get<{ unread_count: number }>('/messaging/unread-count/');
    return res.data.unread_count;
  },
};
