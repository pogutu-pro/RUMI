import apiClient from './client';
import type { SupportTicket, SupportCategory, SupportPriority, TicketReply } from '@/types/entities.types';
import type { ApiResponse } from '@/types/api.types';

export interface GetTicketsFilters {
  status?: SupportTicket['status'];
  category?: SupportCategory;
  priority?: SupportPriority;
  assignedTo?: string;
}

export interface CreateTicketRequest {
  category: SupportCategory;
  subject: string;
  description: string;
  priority?: SupportPriority;
}

/**
 * Get all tickets with optional filters
 */
export const getTickets = async (filters?: GetTicketsFilters): Promise<SupportTicket[]> => {
  const response = await apiClient.axios.get<ApiResponse<SupportTicket[]>>(
    '/support/tickets/',
    { params: filters }
  );
  return response.data.data || [];
};

/**
 * Get a single ticket by ID
 */
export const getTicket = async (ticketId: string): Promise<SupportTicket> => {
  const response = await apiClient.axios.get<ApiResponse<SupportTicket>>(
    `/support/tickets/${ticketId}/`
  );
  if (!response.data.data) {
    throw new Error('Ticket not found');
  }
  return response.data.data;
};

/**
 * Create a new support ticket
 */
export const createTicket = async (data: CreateTicketRequest): Promise<SupportTicket> => {
  const response = await apiClient.axios.post<ApiResponse<SupportTicket>>(
    '/support/tickets/',
    data
  );
  if (!response.data.data) {
    throw new Error('Failed to create ticket');
  }
  return response.data.data;
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (
  id: string,
  status: SupportTicket['status']
): Promise<void> => {
  await apiClient.axios.patch(`/support/tickets/${id}/`, { status });
};

/**
 * Add a reply to a ticket
 */
export const addTicketReply = async (
  ticketId: string,
  message: string,
  isInternal: boolean = false
): Promise<TicketReply> => {
  const response = await apiClient.axios.post<ApiResponse<TicketReply>>(
    `/support/tickets/${ticketId}/replies/`,
    { message, isInternal }
  );
  if (!response.data.data) {
    throw new Error('Failed to add reply');
  }
  return response.data.data;
};

/**
 * Assign ticket to a support agent
 */
export const assignTicket = async (
  ticketId: string,
  assigneeId: string
): Promise<void> => {
  await apiClient.axios.post(`/support/tickets/${ticketId}/assign/`, {
    assigneeId,
  });
};

/**
 * ================================================================================
 * README: Support API Module (support.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Customer support ticket system. Users create tickets, support agents respond
 * and resolve issues.
 *
 * ENDPOINTS:
 * ----------
 * | Method | Endpoint                              | Function           |
 * |--------|--------------------------------------|--------------------|
 * | GET    | /api/v1/support/tickets/             | getTickets()       |
 * | GET    | /api/v1/support/tickets/{id}/        | getTicket()        |
 * | POST   | /api/v1/support/tickets/             | createTicket()     |
 * | PATCH  | /api/v1/support/tickets/{id}/        | updateTicketStatus()|
 * | POST   | /api/v1/support/tickets/{id}/replies/| addTicketReply()   |
 * | POST   | /api/v1/support/tickets/{id}/assign/ | assignTicket()     |
 *
 * CATEGORIES:
 * -----------
 * booking, payment, maintenance, account, other
 *
 * PRIORITIES:
 * -----------
 * low, medium, high, critical
 *
 * USAGE:
 * ------
 * ```typescript
 * const ticket = await createTicket({
 *   category: 'payment',
 *   subject: 'Payment not reflecting',
 *   description: 'I paid but status shows pending'
 * });
 * await addTicketReply(ticket.id, 'We are looking into this');
 * ```
 *
 * ================================================================================
 */
