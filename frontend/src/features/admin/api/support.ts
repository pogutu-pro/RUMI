import api from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

// Real endpoints provided by user
export const getSupportStats = async () => {
    const response = await api.axios.get<ApiResponse<any>>('/support/tickets/stats/');
    return response.data; // Assuming root data or data.data depending on wrapper, stick to standard .data.data pattern if wrapped
};

export const getAdminSupportTickets = async () => {
    const response = await api.axios.get<ApiResponse<any>>('/support/tickets/admin/');
    return response.data;
};

export const getTicketDetails = async (ticketId: string) => {
    const response = await api.axios.get<ApiResponse<any>>(`/support/tickets/${ticketId}/`);
    return response.data;
};

// Activity feed still useful for "Live Logs"
export const getSupportActivity = async () => {
    const response = await api.axios.get<ApiResponse<any>>('/admin/super/activity-feed/', { params: { category: 'support' }});
    return response.data.data;
};
