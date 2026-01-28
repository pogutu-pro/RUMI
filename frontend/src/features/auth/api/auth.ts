import { axiosInstance as axios } from '@/lib/api/client';
import type {
  LoginRequest,
  AuthResponse,
  StudentRegisterRequest,
  LandlordRegisterRequest,
  CaretakerRegisterRequest,
  EmailVerificationRequest,
  PhoneVerificationRequest,
  ResendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateStudentProfileRequest,
  UpdateLandlordProfileRequest,
  ProfileResponse,
  TokenResponse,
  PermissionsResponse,
  MessageResponse,
} from '@/types/api.types';
import type { UpdateProfileFormData } from '@/lib/validations/auth.schema';

/**
 * Login user with email and password
 * Endpoint: POST /api/v1/accounts/login/
 */
async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>('/accounts/login/', data);
  return res.data;
}

/**
 * Check email and authentication method
 * Endpoint: POST /api/v1/accounts/check-email/
 */
async function checkEmail(email: string): Promise<{
  exists: boolean;
  auth_method: 'google' | 'email';
  role?: string;
  message: string;
}> {
  const res = await axios.post('/accounts/check-email/', { email });
  return res.data;
}

/**
 * Check if user has a usable password
 * Endpoint: GET /api/v1/accounts/check-password/
 */
async function checkPasswordStatus(): Promise<{ has_password: boolean; can_set_password: boolean }> {
  const res = await axios.get('/accounts/check-password/');
  return res.data;
}

/**
 * Set password for Google users
 * Endpoint: POST /api/v1/accounts/set-password/
 */
async function setPassword(password: string): Promise<{ message: string }> {
  const res = await axios.post('/accounts/set-password/', { password });
  return res.data;
}

/**
 * Google OAuth login
 * Endpoint: POST /api/v1/accounts/auth/google/
 */
async function googleLogin(token: string, role: string = 'student'): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>('/accounts/auth/google/', { access_token: token, role });
  return res.data;
}

/**
 * Register user
 * Endpoint: POST /api/v1/accounts/register/
 */
async function registerUser<T>(
  data: T,
  rolePath: 'student' | 'landlord' | 'caretaker',
): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>('/accounts/register/', {
    ...data,
    role: rolePath,
  });
  return res.data;
}

const registerStudent = (data: StudentRegisterRequest) =>
  registerUser(data, 'student');
const registerLandlord = (data: LandlordRegisterRequest) =>
  registerUser(data, 'landlord');
const registerCaretaker = (data: CaretakerRegisterRequest) =>
  registerUser(data, 'caretaker');

/**
 * Logout user
 * Endpoint: POST /api/v1/accounts/logout/
 */
async function logout(): Promise<void> {
  await axios.post('/accounts/logout/', {});
}

/**
 * Verify email with OTP
 * Endpoint: POST /api/v1/accounts/verify-email/
 */
async function verifyEmail(data: EmailVerificationRequest): Promise<void> {
  await axios.post('/accounts/verify-email/', data);
}

/**
 * Verify phone with OTP
 * Endpoint: POST /api/v1/accounts/verify-phone/
 */
async function verifyPhone(data: PhoneVerificationRequest): Promise<void> {
  await axios.post('/accounts/verify-phone/', data);
}

/**
 * Resend OTP for verification
 * Endpoint: POST /api/v1/accounts/resend-otp/
 */
async function resendOtp(data: ResendOtpRequest): Promise<void> {
  await axios.post('/accounts/resend-otp/', data);
}

/**
 * Request password reset
 * Endpoint: POST /api/v1/accounts/password/reset/
 */
async function forgotPassword(
  data: ForgotPasswordRequest,
): Promise<MessageResponse> {
  const res = await axios.post<MessageResponse>(
    '/accounts/password/reset/',
    data,
  );
  return res.data;
}

/**
 * Confirm password reset
 * Endpoint: POST /api/v1/accounts/password/reset/confirm/
 */
async function resetPassword(
  data: ResetPasswordRequest,
): Promise<MessageResponse> {
  const res = await axios.post<MessageResponse>(
    '/accounts/password/reset/confirm/',
    data,
  );
  return res.data;
}

/**
 * Verify password reset token
 * Endpoint: GET /api/v1/accounts/password/reset/verify/
 */
async function verifyResetPasswordToken(
  token: string,
): Promise<MessageResponse> {
  const res = await axios.get<MessageResponse>(
    `/accounts/password/reset/verify/?token=${token}`,
  );
  return res.data;
}

/**
 * Get user profile
 * Endpoint: GET /api/v1/accounts/profile/
 */
async function getProfile(): Promise<ProfileResponse> {
  const res = await axios.get<ProfileResponse>('/accounts/profile/');
  return res.data;
}

/**
 * Update user profile
 * Endpoint: PUT /api/v1/accounts/profile/
 */
async function updateProfile(
  data: UpdateProfileFormData,
): Promise<ProfileResponse> {
  const res = await axios.patch<ProfileResponse>('/accounts/profile/', data);
  return res.data;
}

/**
 * Upload profile picture
 * Endpoint: POST /api/v1/accounts/profile/picture/
 */
async function uploadProfilePicture(file: File): Promise<ProfileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post<ProfileResponse>(
    '/accounts/profile/picture/',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return res.data;
}

/**
 * Complete student profile
 * Endpoint: PUT /api/v1/accounts/profile/
 */
async function completeStudentProfile(
  data: UpdateStudentProfileRequest,
): Promise<ProfileResponse> {
  const res = await axios.put<ProfileResponse>('/accounts/profile/', {
    profile: { ...data, type: 'student' },
  });
  return res.data;
}

/**
 * Complete landlord profile
 * Endpoint: PUT /api/v1/accounts/profile/
 */
async function completeLandlordProfile(
  data: UpdateLandlordProfileRequest,
): Promise<ProfileResponse> {
  const res = await axios.put<ProfileResponse>('/accounts/profile/', {
    profile: { ...data, type: 'landlord' },
  });
  return res.data;
}

/**
 * Refresh access token
 * Endpoint: POST /api/v1/accounts/refresh-token/
 */
async function refreshToken(refresh: string): Promise<TokenResponse> {
  const res = await axios.post<TokenResponse>('/accounts/refresh-token/', {
    refresh_token: refresh,
  });
  return res.data;
}

/**
 * Get user permissions
 * Endpoint: GET /api/v1/accounts/permissions/
 */
async function getPermissions(): Promise<PermissionsResponse> {
  const res = await axios.get<PermissionsResponse>('/accounts/permissions/');
  return res.data;
}

export const authApi = {
  login,
  checkEmail,
  checkPasswordStatus,
  setPassword,
  googleLogin,
  registerStudent,
  registerLandlord,
  registerCaretaker,
  logout,
  verifyEmail,
  verifyPhone,
  resendOtp,
  forgotPassword,
  resetPassword,
  verifyResetPasswordToken,
  getProfile,
  completeStudentProfile,
  completeLandlordProfile,
  updateProfile,
  uploadProfilePicture,
  refreshToken,
  getPermissions,
};
