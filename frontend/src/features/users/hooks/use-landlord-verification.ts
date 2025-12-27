import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/features/users/api/users';
import { LandlordVerificationRequest } from '@/features/users/api/users';

export const useLandlordVerifications = (params?: any) => {
  return useQuery({
    queryKey: ['landlord-verifications', params],
    queryFn: () => usersApi.getLandlordVerifications(params),
  });
};

export const useVerifyLandlord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      action, 
      data 
    }: { 
      id: string; 
      action: 'approve' | 'reject'; 
      data?: LandlordVerificationRequest 
    }) => usersApi.verifyLandlord(id, action, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-verifications'] });
      // Also invalidate users list as status might change
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
