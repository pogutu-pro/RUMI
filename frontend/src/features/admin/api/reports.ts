import api from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

// Using available endpoints that map to "Reports" functionality

export const getPaymentTaxReports = async () => {
    // Endpoints for tax reports
    // GET /payments/tax-reports/
    const response = await api.axios.get<ApiResponse<any>>('/payments/tax-reports/');
    return response.data.data;
};

export const getSystemActivityFeed = async () => {
    // Can be used as a "System Audit" report source
    // GET /admin/super/activity-feed/
    const response = await api.axios.get<ApiResponse<any>>('/admin/super/activity-feed/');
    return response.data.data;
};

export const getRefundRequests = async () => {
    // Financial report data source
    // GET /payments/refunds/list/
    const response = await api.axios.get<ApiResponse<any>>('/payments/refunds/list/');
    return response.data.data;
};
