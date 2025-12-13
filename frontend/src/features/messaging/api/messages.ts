import apiClient from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Conversation, Message } from '@/types/entities.types';
import type { 
  SendMessageRequest, 
  CreateConversationRequest 
} from '@/features/messaging/types';

export interface GetMessagesParams {
  limit?: number;
  before?: string; // message ID
  after?: string; // message ID
}

export interface GetConversationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

/**
 * Get all conversations for the current user
 * Endpoint: GET /api/v1/accounts/chat/conversations/
 */
// Endpoints updated to follow standard REST patterns
export const getConversations = async (
  params?: GetConversationsParams
): Promise<PaginatedResponse<Conversation>> => {
  const response = await apiClient.axios.get<PaginatedResponse<Conversation>>(
    '/chat/conversations/',
    { params }
  );
  return response.data;
};

export const getConversation = async (
  conversationId: string
): Promise<ApiResponse<Conversation>> => {
  const response = await apiClient.axios.get<ApiResponse<Conversation>>(
    `/chat/conversations/${conversationId}/`
  );
  return response.data;
};

export const getMessages = async (
  conversationId: string,
  params?: GetMessagesParams
): Promise<PaginatedResponse<Message>> => {
  const response = await apiClient.axios.get<PaginatedResponse<Message>>(
    `/chat/conversations/${conversationId}/messages/`,
    { params }
  );
  return response.data;
};

export const sendMessage = async (
  conversationId: string,
  data: SendMessageRequest
): Promise<ApiResponse<Message>> => {
  const response = await apiClient.axios.post<ApiResponse<Message>>(
    `/chat/conversations/${conversationId}/messages/`,
    data
  );
  return response.data;
};

export const markMessageAsRead = async (
  conversationId: string,
  messageId: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.put<ApiResponse<void>>(
    `/chat/conversations/${conversationId}/messages/${messageId}/read/`
  );
  return response.data;
};

export const markConversationAsRead = async (
  conversationId: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.put<ApiResponse<void>>(
    `/chat/conversations/${conversationId}/read/`
  );
  return response.data;
};

export const createConversation = async (
  data: CreateConversationRequest
): Promise<ApiResponse<Conversation>> => {
  const response = await apiClient.axios.post<ApiResponse<Conversation>>(
    '/chat/conversations/',
    data
  );
  return response.data;
};

export const deleteConversation = async (
  conversationId: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.delete<ApiResponse<void>>(
    `/chat/conversations/${conversationId}/`
  );
  return response.data;
};

export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  const response = await apiClient.axios.get<ApiResponse<{ count: number }>>(
    '/chat/unread-count/'
  );
  return response.data;
};

export const messagesApi = {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  markMessageAsRead,
  markConversationAsRead,
  createConversation,
  deleteConversation,
  getUnreadCount,
};

