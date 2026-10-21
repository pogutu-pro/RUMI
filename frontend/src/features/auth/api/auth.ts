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

export interface SignInMethods {
  google_client_id: string | null;
  email_link: boolean;
}

/** Which sign-in buttons to show. Endpoint: GET /api/v1/accounts/auth/methods/ */
async function signInMethods(): Promise<SignInMethods> {
  const res = await axios.get<SignInMethods>('/accounts/auth/methods/');
  return res.data;
}

/**
 * Email a one-time sign-in link and code. The answer is the same whether or
 * not the address has an account. Endpoint: POST /api/v1/accounts/auth/email-link/
 */
async function requestEmailLink(email: string, next?: string): Promise<{ sent: boolean; expires_in: number }> {
  const res = await axios.post('/accounts/auth/email-link/', { email, next: next || '' });
  return res.data;
}

export type EmailLinkProof = { token: string } | { email: string; code: string };

/** Sign in with the emailed link or its code. Creates a landlord account for a new address. */
async function signInWithEmailLink(proof: EmailLinkProof): Promise<AuthResponse & { is_new_user: boolean }> {
  const res = await axios.post('/accounts/auth/email-link/sign-in/', proof);
  return res.data;
}

/** Sign in with a Google Identity Services ID token. */
async function signInWithGoogle(credential: string): Promise<AuthResponse & { is_new_user: boolean }> {
  const res = await axios.post('/accounts/auth/google/', { credential });
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
  // The backend serializer names the field `otp_code`; the form calls it `otp`.
  await axios.post('/accounts/verify-email/', { email: data.email, otp_code: data.otp });
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
  // The backend serializer names the field `new_password`; the forms call it
  // `password`. Sending it under the form's name was rejected with a 400 on
  // every attempt, so no invited caretaker/tenant or reset user could ever
  // set a password.
  const res = await axios.post<MessageResponse>(
    '/accounts/password/reset/confirm/',
    {
      token: data.token,
      new_password: data.password,
      confirm_password: data.confirm_password,
    },
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
 *
 * Backend/accounts/views.py ProfilePictureUploadView.post returns a FLAT
 * { message, profile_picture_url } shape — no `.user` key, unlike
 * ProfileResponse. The previous `Promise<ProfileResponse>` return type lied
 * about the real shape, which is what let the response.user.profile_picture
 * bug ship silently in use-auth.ts's uploadPhoto.
 */
async function uploadProfilePicture(
  file: File,
): Promise<{ message: string; profile_picture_url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  // Content-Type: undefined here on purpose, not omitted — the axios
  // instance sets a default 'Content-Type: application/json' (lib/api/
  // client.ts), and either that default OR a hardcoded
  // 'multipart/form-data' string with no boundary= parameter breaks
  // Django's multipart parser (it needs the boundary to split the body
  // into parts) — request.FILES ends up empty and the upload silently
  // 400s. Explicitly undefined removes the header for this one request so
  // the browser sets Content-Type itself, which is the only way the
  // boundary gets attached correctly for a FormData body.
  const res = await axios.post<{ message: string; profile_picture_url: string }>(
    '/accounts/profile/picture/',
    formData,
    { headers: { 'Content-Type': undefined } },
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
 * Save onboarding draft
 */
async function saveOnboardingDraft(data: any): Promise<{ status: string }> {
  const res = await axios.post('/accounts/onboarding/draft/', data);
  return res.data;
}

/**
 * Advance onboarding stage
 */
async function advanceOnboardingStage(nextStage: string): Promise<{ status: string; current_stage: string }> {
  const res = await axios.post('/accounts/onboarding/advance/', { next_stage: nextStage });
  return res.data;
}

/**
 * Finalize onboarding
 */
async function finalizeOnboarding(): Promise<{ status: string; user: any }> {
  const res = await axios.post('/accounts/onboarding/finalize/', {});
  return res.data;
}

/**
 * Landlord wizard-derivation block returned by
 * `GET /accounts/onboarding/status/` for landlord users only (Backend/
 * accounts/onboarding_views.py `OnboardingStatusView.get`, Phase 4 Plan 01).
 * `current_step` is 1-5, server-derived from real org/property/payout/tier
 * state — never a client-local draft-replay value.
 */
export interface OnboardingWizardStatus {
  organization_id: string | null;
  organization_name: string | null;
  has_property: boolean;
  payout_status: 'not_started' | 'pending_verification' | 'active';
  selected_tier: string | null;
  current_step: number;
}

/**
 * Get onboarding status
 */
async function getOnboardingStatus(): Promise<{
  onboarding_stage: string;
  is_complete: boolean;
  draft_data: any;
  role: string;
  wizard: OnboardingWizardStatus | null;
}> {
  const res = await axios.get('/accounts/onboarding/status/');
  return res.data;
}

/**
 * Get user permissions
 * Endpoint: GET /api/v1/accounts/permissions/
 */
async function getPermissions(): Promise<any> {
  const res = await axios.get('/accounts/permissions/');
  return res.data;
}

export const authApi = {
  login,
  signInMethods,
  requestEmailLink,
  signInWithEmailLink,
  signInWithGoogle,
  checkEmail,
  checkPasswordStatus,
  setPassword,
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
  saveOnboardingDraft,
  advanceOnboardingStage,
  finalizeOnboarding,
  getOnboardingStatus,
};
