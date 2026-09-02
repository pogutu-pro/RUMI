export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'general' | 'maintenance';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  created_by: string;
  created_by_name: string;
  created_by_role: string;
  organization: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory;
  unit: string | null;
  unit_label: string | null;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket: string;
  author: string;
  author_name: string;
  message: string;
  created_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: TicketMessage[];
}
