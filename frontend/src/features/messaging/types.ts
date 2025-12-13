import type { ID, Timestamp, UserRole } from '@/features/auth/types/types';

// ============================================================================
// CORE TYPES
// ============================================================================

export type MessageType = 'text' | 'image' | 'video' | 'pdf' | 'voice' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type AttachmentType = 'image' | 'video' | 'pdf' | 'voice';

// ============================================================================
// PARTICIPANT
// ============================================================================

export interface Participant {
  id: ID;
  userId: ID;
  name: string;
  role: UserRole;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Timestamp;
  hostelName?: string; // For context
}

// ============================================================================
// ATTACHMENT
// ============================================================================

export interface Attachment {
  id: ID;
  messageId: ID;
  fileType: AttachmentType;
  fileUrl: string;
  fileName: string;
  fileSize: number; // in bytes
  thumbnailUrl?: string; // for videos/PDFs
  uploadProgress?: number; // 0-100 for in-progress uploads
  createdAt: Timestamp;
}

// ============================================================================
// MESSAGE
// ============================================================================

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  attachments: Attachment[];
  status: MessageStatus;
  readBy: ID[]; // Array of user IDs who have read the message
  createdAt: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  isOwnMessage?: boolean; // Computed on client
}

// ============================================================================
// CONVERSATION
// ============================================================================

export interface Conversation {
  id: ID;
  hostelId: ID;
  hostelName: string;
  participants: Participant[];
  lastMessage: Message | null;
  unreadCount: number;
  typingUsers: ID[]; // Array of user IDs currently typing
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Computed/helper properties
  otherParticipant?: Participant; // The person you're chatting with (not yourself)
  title?: string; // Display name for conversation
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================

export interface TypingIndicator {
  conversationId: ID;
  userId: ID;
  userName: string;
  timestamp: Timestamp;
}

// ============================================================================
// MESSAGING STATE (Zustand Store)
// ============================================================================

export interface MessagingState {
  // Data
  conversations: Conversation[];
  activeConversationId: ID | null;
  messages: Record<ID, Message[]>; // conversationId -> messages[]
  typingIndicators: Record<ID, TypingIndicator[]>; // conversationId -> typing users
  
  // UI State
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  searchQuery: string;
  filter: 'all' | 'unread' | 'pinned';
  showConversationInfo: boolean;
  
  // Actions - Conversations
  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: ID) => Promise<void>;
  pinConversation: (conversationId: ID) => Promise<void>;
  unpinConversation: (conversationId: ID) => Promise<void>;
  muteConversation: (conversationId: ID) => Promise<void>;
  unmuteConversation: (conversationId: ID) => Promise<void>;
  deleteConversation: (conversationId: ID) => Promise<void>;
  
  // Actions - Messages
  fetchMessages: (conversationId: ID) => Promise<void>;
  sendMessage: (conversationId: ID, content: string) => Promise<void>;
  sendAttachment: (conversationId: ID, file: File) => Promise<void>;
  markAsRead: (conversationId: ID) => Promise<void>;
  editMessage: (messageId: ID, content: string) => Promise<void>;
  deleteMessage: (messageId: ID) => Promise<void>;
  
  // Actions - Search & Filter
  setSearchQuery: (query: string) => void;
  setFilter: (filter: 'all' | 'unread' | 'pinned') => void;
  searchMessages: (query: string) => Promise<Message[]>;
  
  // Actions - UI
  toggleConversationInfo: () => void;
  setTyping: (conversationId: ID, isTyping: boolean) => void;
  
  // Helpers
  getUnreadCount: () => number;
  getConversation: (conversationId: ID) => Conversation | undefined;
  getMessages: (conversationId: ID) => Message[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SendMessageRequest {
  content: string;
  messageType?: MessageType;
  attachments?: File[];
}

export interface CreateConversationRequest {
  participantId: ID;
  message?: string;
}

export interface SendMessageResponse {
  message: Message;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
  total: number;
}

export interface GetMessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface MarkAsReadRequest {
  conversationId: ID;
  messageIds?: ID[]; // If empty, mark all as read
}

export interface UploadAttachmentRequest {
  file: File;
  conversationId: ID;
}

export interface UploadAttachmentResponse {
  attachment: Attachment;
}
