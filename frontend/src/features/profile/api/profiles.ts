import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  User,
  UserProfile,
  StudentProfile,
  LandlordProfile,
  CaretakerProfile,
  LifestylePreferences,
} from '@/types/auth.types';
import type {
  UpdateProfileRequest,
  UpdateStudentProfileRequest,
  UpdateLandlordProfileRequest,
  UpdateCaretakerProfileRequest,
} from '../types';

// Request types are now imported from ../types

export interface ProfileResponse {
  user: User;
  profile: UserProfile | null;
}

/**
 * Get the current user's profile
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.axios.get<ProfileResponse>(
    '/api/v1/accounts/profile/'
  );
  return response.data;
};

/**
 * Get a specific user's profile by ID (admin/public view)
 */
export const getUserProfile = async (userId: string): Promise<ProfileResponse> => {
  const response = await apiClient.axios.get<ProfileResponse>(
    `/api/v1/accounts/users/${userId}/profile/`
  );
  return response.data;
};

/**
 * Update basic user information
 */
export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<ApiResponse<User>> => {
  const response = await apiClient.axios.patch<ApiResponse<User>>(
    '/api/v1/accounts/profile/',
    data
  );
  return response.data;
};

/**
 * Update student-specific profile
 */
export const updateStudentProfile = async (
  data: UpdateStudentProfileRequest
): Promise<ApiResponse<StudentProfile>> => {
  const response = await apiClient.axios.patch<ApiResponse<StudentProfile>>(
    '/api/v1/accounts/profile/student/',
    data
  );
  return response.data;
};

/**
 * Update landlord-specific profile
 */
export const updateLandlordProfile = async (
  data: UpdateLandlordProfileRequest
): Promise<ApiResponse<LandlordProfile>> => {
  const response = await apiClient.axios.patch<ApiResponse<LandlordProfile>>(
    '/api/v1/accounts/profile/landlord/',
    data
  );
  return response.data;
};

/**
 * Update caretaker-specific profile
 */
export const updateCaretakerProfile = async (
  data: UpdateCaretakerProfileRequest
): Promise<ApiResponse<CaretakerProfile>> => {
  const response = await apiClient.axios.patch<ApiResponse<CaretakerProfile>>(
    '/api/v1/accounts/profile/caretaker/',
    data
  );
  return response.data;
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (
  file: File
): Promise<ApiResponse<{ url: string }>> => {
  const formData = new FormData();
  formData.append('image', file);

  // NOTE: this component (AvatarUpload, via useUploadProfileImage) isn't
  // rendered on any page right now — dead code, not the tenant photo-
  // upload bug that was actually reported. Also worth knowing if this
  // ever gets wired up: '/accounts/profile/upload-image/' has no matching
  // URL in Backend/accounts/urls.py at all — the real, working endpoint is
  // '/accounts/profile/picture/' (ProfilePictureUploadView), used by
  // features/auth/api/auth.ts's uploadProfilePicture instead. Left as-is
  // rather than rewiring unreachable code.
  //
  // Content-Type: undefined, not a hardcoded 'multipart/form-data' string
  // — see the identical fix + comment in features/auth/api/auth.ts's
  // uploadProfilePicture for why (no boundary= param breaks Django's
  // multipart parser).
  const response = await apiClient.axios.post<ApiResponse<{ url: string }>>(
    '/api/v1/accounts/profile/upload-image/',
    formData,
    { headers: { 'Content-Type': undefined } }
  );
  return response.data;
};

/**
 * Delete profile image
 */
export const deleteProfileImage = async (): Promise<ApiResponse<void>> => {
  const response = await apiClient.axios.delete<ApiResponse<void>>(
    '/api/v1/accounts/profile/image/'
  );
  return response.data;
};

/**
 * Update lifestyle preferences (for students)
 */
export const updateLifestylePreferences = async (
  data: LifestylePreferences
): Promise<ApiResponse<LifestylePreferences>> => {
  const response = await apiClient.axios.patch<
    ApiResponse<LifestylePreferences>
  >('/api/v1/accounts/profile/lifestyle-preferences/', data);
  return response.data;
};

export const profilesApi = {
  getProfile,
  getUserProfile,
  updateProfile,
  updateStudentProfile,
  updateLandlordProfile,
  updateCaretakerProfile,
  uploadProfileImage,
  deleteProfileImage,
  updateLifestylePreferences,
};
