import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/lib/api/profiles';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import type {
  UpdateProfileRequest,
  UpdateStudentProfileRequest,
  UpdateLandlordProfileRequest,
  UpdateCaretakerProfileRequest,
} from '@/lib/api/profiles';

/**
 * Hook to fetch the current user's profile
 * @returns Query result with profile data
 */
export const useProfile = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => profilesApi.getProfile(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a specific user's profile
 * @param userId - The ID of the user
 * @returns Query result with profile data
 */
export const useUserProfile = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return profilesApi.getUserProfile(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to update basic user profile
 * @returns Mutation for updating profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profilesApi.updateProfile(data),
    onSuccess: (response) => {
      if (response.data) {
        setUser(response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    },
  });
};

/**
 * Hook to update student profile
 * @returns Mutation for updating student profile
 */
export const useUpdateStudentProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStudentProfileRequest) =>
      profilesApi.updateStudentProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Student profile updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update student profile';
      toast.error(message);
    },
  });
};

/**
 * Hook to update landlord profile
 * @returns Mutation for updating landlord profile
 */
export const useUpdateLandlordProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateLandlordProfileRequest) =>
      profilesApi.updateLandlordProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Landlord profile updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update landlord profile';
      toast.error(message);
    },
  });
};

/**
 * Hook to update caretaker profile
 * @returns Mutation for updating caretaker profile
 */
export const useUpdateCaretakerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCaretakerProfileRequest) =>
      profilesApi.updateCaretakerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Caretaker profile updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update caretaker profile';
      toast.error(message);
    },
  });
};

/**
 * Hook to upload profile image
 * @returns Mutation for uploading profile image
 */
export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profilesApi.uploadProfileImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile image uploaded successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to upload profile image';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete profile image
 * @returns Mutation for deleting profile image
 */
export const useDeleteProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profilesApi.deleteProfileImage(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile image deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete profile image';
      toast.error(message);
    },
  });
};
