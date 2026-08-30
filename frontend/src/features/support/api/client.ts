import { axiosInstance as axios } from '@/lib/api/client';
import type { SupportTicket, SupportTicketDetail, TicketMessage, TicketStatus } from '../types/types';

export const supportApi = {
  listTickets: async (status?: TicketStatus): Promise<SupportTicket[]> => {
    const res = await axios.get<SupportTicket[]>('/support/tickets/', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },
  getTicket: async (id: string): Promise<SupportTicketDetail> => {
    const res = await axios.get<SupportTicketDetail>(`/support/tickets/${id}/`);
    return res.data;
  },
  createTicket: async (payload: { subject: string; description: string }): Promise<SupportTicket> => {
    const res = await axios.post<SupportTicket>('/support/tickets/', payload);
    return res.data;
  },
  updateTicket: async (id: string, payload: { status?: TicketStatus; assigned_to?: string | null }): Promise<SupportTicket> => {
    const res = await axios.patch<SupportTicket>(`/support/tickets/${id}/`, payload);
    return res.data;
  },
  addMessage: async (ticketId: string, message: string): Promise<TicketMessage> => {
    const res = await axios.post<TicketMessage>(`/support/tickets/${ticketId}/messages/`, { message });
    return res.data;
  },
};
