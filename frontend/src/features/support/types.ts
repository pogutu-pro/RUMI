export type SupportCategory =
  | 'technical'
  | 'billing'
  | 'booking'
  | 'maintenance'
  | 'general';
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  category: SupportCategory;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface SupportTicketSummary {
  id: string;
  subject: string;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: string;
  lastUpdated: string;
}
