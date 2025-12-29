import api from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

// Proposed Endpoints for 2FA
export const enable2FA = async () => {
    // Should return { secret: '...', qr_code: '...' }
    const response = await api.axios.post<ApiResponse<any>>('/auth/2fa/enable/');
    return response.data;
};

export const verify2FA = async (code: string) => {
    const response = await api.axios.post<ApiResponse<any>>('/auth/2fa/verify/', { code });
    return response.data;
};

export const disable2FA = async () => {
    const response = await api.axios.post<ApiResponse<any>>('/auth/2fa/disable/');
    return response.data;
};

export const changePassword = async (data: any) => {
    const response = await api.axios.post<ApiResponse<any>>('/accounts/users/me/change-password/', data);
    return response.data;
};
