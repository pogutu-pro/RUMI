import { useQuery } from '@tanstack/react-query';
import { 
    getSupportStats, 
    getAdminSupportTickets,
    getSupportActivity,
    getTicketDetails
} from '../api/support';

export const useSupportStats = () => {
  return useQuery({
    queryKey: ['admin-support-stats'],
    queryFn: async () => {
        const res: any = await getSupportStats();
        return res.data || res; // Handle potential wrapper inconsistency
    }
  });
};

export const useAdminTickets = () => {
  return useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
        const res: any = await getAdminSupportTickets();
        return res.data || res;
    }
  });
};

export const useTicketDetails = (id: string) => {
    return useQuery({
        queryKey: ['admin-ticket-details', id],
        queryFn: () => getTicketDetails(id),
        enabled: !!id
    });
};

export const useSupportActivity = () => {
  return useQuery({
    queryKey: ['admin-support-activity'],
    queryFn: getSupportActivity,
  });
};
