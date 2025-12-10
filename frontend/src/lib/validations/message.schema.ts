import { z } from 'zod';

/**
 * Message validation schemas
 */

export const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  type: z.enum(['text', 'image', 'file']).default('text'),
  attachments: z.array(z.string()).optional(),
}).refine((data) => data.conversationId || data.recipientId, {
  message: 'Either conversationId or recipientId must be provided',
});

export const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
  initialMessage: z.string().optional(),
});

export const markAsReadSchema = z.object({
  messageIds: z.array(z.string()).min(1),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().min(1),
  deleteForEveryone: z.boolean().default(false),
});

export const searchMessagesSchema = z.object({
  query: z.string().min(1),
  conversationId: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;

export const messageSchema = {
  send: sendMessageSchema,
  createConversation: createConversationSchema,
  markAsRead: markAsReadSchema,
  delete: deleteMessageSchema,
  search: searchMessagesSchema,
};
