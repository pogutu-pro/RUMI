import { authApi } from '../auth';

const post = jest.fn();

jest.mock('@/lib/api/client', () => ({
  axiosInstance: { post: (...args: unknown[]) => post(...args), get: jest.fn() },
}));

describe('auth API request contracts (field names the Django serializers require)', () => {
  beforeEach(() => post.mockReset().mockResolvedValue({ data: {} }));

  it('reset confirm sends new_password, not password', async () => {
    await authApi.resetPassword({ token: 't-1', password: 'Str0ng!Pass', confirm_password: 'Str0ng!Pass' });
    expect(post).toHaveBeenCalledWith('/accounts/password/reset/confirm/', {
      token: 't-1',
      new_password: 'Str0ng!Pass',
      confirm_password: 'Str0ng!Pass',
    });
  });

  it('verify email sends otp_code, not otp', async () => {
    await authApi.verifyEmail({ token: '', email: 'a@b.co', otp: '123456' });
    expect(post).toHaveBeenCalledWith('/accounts/verify-email/', { email: 'a@b.co', otp_code: '123456' });
  });

  it('email link: request, then sign in with the token or the code', async () => {
    await authApi.requestEmailLink('grace@example.com', '/tenant/rental');
    expect(post).toHaveBeenCalledWith('/accounts/auth/email-link/', { email: 'grace@example.com', next: '/tenant/rental' });
    await authApi.signInWithEmailLink({ token: 'abc' });
    expect(post).toHaveBeenCalledWith('/accounts/auth/email-link/sign-in/', { token: 'abc' });
    await authApi.signInWithEmailLink({ email: 'grace@example.com', code: '123456' });
    expect(post).toHaveBeenCalledWith('/accounts/auth/email-link/sign-in/', { email: 'grace@example.com', code: '123456' });
  });

  it('google sends the ID token as credential', async () => {
    await authApi.signInWithGoogle('id-token');
    expect(post).toHaveBeenCalledWith('/accounts/auth/google/', { credential: 'id-token' });
  });
});
