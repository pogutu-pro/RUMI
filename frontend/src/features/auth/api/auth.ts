import { axiosInstance as axios } from '@/lib/api/client';
import { setTokens, clearTokens, setUserRole } from '@/lib/auth/token';
import { csrf } from '@/lib/security/csrf';
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
  StudentProfileRequest,
  LandlordProfileRequest,
  ProfileResponse,
  TokenResponse,
  PermissionsResponse,
  MessageResponse,
  StudentProfile,
  LandlordProfile,
  User,
  UserProfile,
  ApiResponse,
} from '@/types/api.types';
import type { UpdateProfileFormData } from '@/lib/validations/auth.schema';

/**
 * Login user with email and password
 * Endpoint: POST /api/v1/accounts/login/
 */
async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>('/accounts/login/', data, {
    headers: csrf.getHeader(),
  });
  const payload = res.data;
  
  if (payload.access && payload.refresh) {
    setTokens(payload.access, payload.refresh);
  }
  if (payload.user?.role) {
    setUserRole(payload.user.role);
  }
  return payload;
}

/**
 * Google OAuth login
 * Endpoint: POST /api/v1/accounts/google/
 * Note: This endpoint may need to be implemented on the backend
 */
async function googleLogin(token: string): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>('/accounts/google/', 
    { token },
    { headers: csrf.getHeader() }
  );
  const payload = res.data;

  if (payload.access && payload.refresh) {
    setTokens(payload.access, payload.refresh);
  }
  if (payload.user?.role) {
    setUserRole(payload.user.role);
  }
  return payload;
}

/**
 * Register user
 * Endpoint: POST /api/v1/accounts/register/
 */
async function registerUser<T>(
  data: T,
  rolePath: 'student' | 'landlord' | 'caretaker',
): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>(
    '/accounts/register/', 
    { ...data, role: rolePath },
    { headers: csrf.getHeader() }
  );
  const payload = res.data;
  
  if (payload.access && payload.refresh) {
    setTokens(payload.access, payload.refresh);
  }
  if (payload.user?.role) {
    setUserRole(payload.user.role);
  }
  return payload;
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
  try {
    await axios.post('/accounts/logout/', {}, { headers: csrf.getHeader() });
  } finally {
    clearTokens();
  }
}

/**
 * Verify email with OTP
 * Endpoint: POST /api/v1/accounts/verify-email/
 */
async function verifyEmail(data: EmailVerificationRequest): Promise<void> {
  await axios.post('/accounts/verify-email/', data, {
    headers: csrf.getHeader(),
  });
}

/**
 * Verify phone with OTP
 * Endpoint: POST /api/v1/accounts/verify-phone/
 */
async function verifyPhone(data: PhoneVerificationRequest): Promise<void> {
  await axios.post('/accounts/verify-phone/', data, {
    headers: csrf.getHeader(),
  });
}

/**
 * Resend OTP for verification
 * Endpoint: POST /api/v1/accounts/resend-otp/
 */
async function resendOtp(data: ResendOtpRequest): Promise<void> {
  await axios.post('/accounts/resend-otp/', data, {
    headers: csrf.getHeader(),
  });
}

/**
 * Request password reset
 * Endpoint: POST /api/v1/accounts/password/reset/
 */
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
    { headers: csrf.getHeader() }
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
    { headers: csrf.getHeader() }
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
  const res = await axios.put<ProfileResponse>(
    '/accounts/profile/',
    data,
    { headers: csrf.getHeader() }
  );
  return res.data;
}

/**
 * Upload profile picture
 * Endpoint: POST /api/v1/accounts/profile/picture/
 */
async function uploadProfilePicture(file: File): Promise<ProfileResponse> {
  const formData = new FormData();
  formData.append('picture', file);
  
  const res = await axios.post<ProfileResponse>(
    '/accounts/profile/picture/',
    formData,
    {
      headers: {
        ...csrf.getHeader(),
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
}

/**
 * Complete student profile
 * Endpoint: PUT /api/v1/accounts/profile/
 */
async function completeStudentProfile(
  data: StudentProfileRequest,
): Promise<ProfileResponse> {
  const res = await axios.put<ProfileResponse>(
    '/accounts/profile/',
    { profile: { ...data, type: 'student' } },
    { headers: csrf.getHeader() }
  );
  return res.data;
}

/**
 * Complete landlord profile
 * Endpoint: PUT /api/v1/accounts/profile/
 */
async function completeLandlordProfile(
  data: LandlordProfileRequest,
): Promise<ProfileResponse> {
  const res = await axios.put<ProfileResponse>(
    '/accounts/profile/',
    { profile: { ...data, type: 'landlord' } },
    { headers: csrf.getHeader() }
  );
  return res.data;
}

/**
 * Refresh access token
 * Endpoint: POST /api/v1/accounts/refresh-token/
 */
async function refreshToken(refresh: string): Promise<TokenResponse> {
  const res = await axios.post<TokenResponse>(
    '/accounts/refresh-token/',
    { refresh },
  );
  const payload = res.data;
  if (payload.access && payload.refresh)
    setTokens(payload.access, payload.refresh);
  return payload;
}

/**
 * Get user permissions
 * Endpoint: GET /api/v1/accounts/permissions/
 */
async function getPermissions(): Promise<PermissionsResponse> {
  const res = await axios.get<PermissionsResponse>(
    '/accounts/permissions/',
  );
  return res.data;
}

export const authApi = {
  login,
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
  getProfile,
  completeStudentProfile,
  completeLandlordProfile,
  updateProfile,
  uploadProfilePicture,
  refreshToken,
  getPermissions,
};

export default login;
