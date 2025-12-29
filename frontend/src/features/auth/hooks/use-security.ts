import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { enable2FA, verify2FA, disable2FA, changePassword } from '../api/security';

export const useEnable2FA = () => {
  return useMutation({
    mutationFn: enable2FA,
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to initiate 2FA setup');
    }
  });
};

export const useVerify2FA = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: verify2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success('Two-Factor Authentication enabled successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Invalid code');
        }
    });
};

export const useDisable2FA = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: disable2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success('Two-Factor Authentication disabled');
        },
        onError: (error: any) => {
             toast.error(error?.response?.data?.message || 'Failed to disable 2FA');
        }
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            toast.success('Password updated successfully');
        },
        onError: (error: any) => {
             toast.error(error?.response?.data?.message || 'Failed to update password');
        }
    });
};
