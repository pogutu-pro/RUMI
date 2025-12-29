import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { techSupportApi } from '../api/tech-support';
import { toast } from 'sonner';

export const useTechSupportUsers = (params?: any) => {
  return useQuery({
    queryKey: ['tech-support-users', params],
    queryFn: () => techSupportApi.getAll(params),
  });
};

export const useCreateTechSupportUser = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: any) => techSupportApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tech-support-users'] });
            toast.success('Tech support user created successfully');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to create tech support user';
            toast.error(message);
        }
    });
};
