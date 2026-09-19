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
});
