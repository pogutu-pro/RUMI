import api from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

// Real endpoint found: /admin/super/system/health/
export const getSystemHealth = async () => {
    const response = await api.axios.get<ApiResponse<any>>('/admin/super/system/health/');
    return response.data; // data.data usually
};

// Real endpoint found: /admin/super/platform/stats/
export const getSystemStats = async () => {
    const response = await api.axios.get<ApiResponse<any>>('/admin/super/platform/stats/');
    return response.data;
};

export const getSystemLogs = async () => {
    const response = await api.axios.get<ApiResponse<any>>('/admin/super/activity-feed/');
    return response.data.data;
};
