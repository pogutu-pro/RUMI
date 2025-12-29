import { useQuery } from '@tanstack/react-query';
import { 
    getSystemHealth, 
    getSystemLogs,
    getSystemStats
} from '../api/monitoring';

export const useSystemHealth = (refetchInterval = 30000) => {
  return useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
        const res: any = await getSystemHealth();
        return res.data || res;
    },
    refetchInterval,
  });
};

export const useSystemStats = () => {
    return useQuery({
        queryKey: ['admin-system-stats'],
        queryFn: async () => {
            const res: any = await getSystemStats();
            return res.data || res;
        }
    });
};

export const useSystemLogs = () => {
    return useQuery({
        queryKey: ['admin-system-logs'],
        queryFn: getSystemLogs,
    });
};
