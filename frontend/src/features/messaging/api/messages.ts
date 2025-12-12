import apiClient from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Conversation, Message } from '@/types/entities.types';

export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'image' | 'file';
  metadata?: Record<string, unknown>;
}

export interface CreateConversationRequest {
  participantIds: string[];
  initialMessage?: string;
}

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
export const getConversations = async (
  params?: GetConversationsParams
): Promise<PaginatedResponse<Conversation>> => {
  const response = await apiClient.axios.get<PaginatedResponse<Conversation>>(
    '/accounts/chat/conversations/',
    { params }
  );
  return response.data;
};

/**
 * Get a single conversation by ID
 * Endpoint: GET /api/v1/accounts/chat/conversations/{id}/
 */
export const getConversation = async (
  conversationId: string
): Promise<ApiResponse<Conversation>> => {
  const response = await apiClient.axios.get<ApiResponse<Conversation>>(
    `/accounts/chat/conversations/${conversationId}/`
  );
  return response.data;
};

/**
 * Get messages for a specific conversation
 * Endpoint: GET /api/v1/accounts/chat/conversations/{id}/messages/
 */
export const getMessages = async (
  conversationId: string,
  params?: GetMessagesParams
): Promise<PaginatedResponse<Message>> => {
  const response = await apiClient.axios.get<PaginatedResponse<Message>>(
    `/accounts/chat/conversations/${conversationId}/messages/`,
    { params }
  );
  return response.data;
};

/**
 * Send a message in a conversation
 * Endpoint: POST /api/v1/accounts/chat/conversations/{id}/messages/
 */
export const sendMessage = async (
  conversationId: string,
  data: SendMessageRequest
): Promise<ApiResponse<Message>> => {
  const response = await apiClient.axios.post<ApiResponse<Message>>(
    `/accounts/chat/conversations/${conversationId}/messages/`,
    data
  );
  return response.data;
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (
  conversationId: string,
  messageId: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.put<ApiResponse<void>>(
    `/accounts/chat/conversations/${conversationId}/messages/${messageId}/read/`
  );
  return response.data;
};

/**
 * Mark all messages in a conversation as read
 */
export const markConversationAsRead = async (
  conversationId: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.put<ApiResponse<void>>(
    `/accounts/chat/conversations/${conversationId}/read/`
  );
  return response.data;
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  data: CreateConversationRequest
): Promise<ApiResponse<Conversation>> => {
  const response = await apiClient.axios.post<ApiResponse<Conversation>>(
    '/accounts/chat/conversations/',
    data
  );
  return response.data;
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (
  conversationId: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.delete<ApiResponse<void>>(
    `/accounts/chat/conversations/${conversationId}/`
  );
  return response.data;
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  const response = await apiClient.axios.get<ApiResponse<{ count: number }>>(
    '/accounts/chat/unread-count/'
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

