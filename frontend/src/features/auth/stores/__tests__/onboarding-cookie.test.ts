import { getOnboardingStage } from '@/lib/auth/token';
import { useAuthStore } from '../auth.store';

describe('onboarding stage cookie', () => {
  it('is refreshed when the user is updated, so the site stops sending a finished landlord back to onboarding', () => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'l@x.co', role: 'landlord', onboarding_stage: 'REGISTERED' } as never,
    });
    document.cookie = 'rumi_onboarding_stage=REGISTERED; path=/';
    expect(getOnboardingStage()).toBe('REGISTERED');

    useAuthStore.getState().updateUser({ onboarding_stage: 'COMPLETED' });

    expect(getOnboardingStage()).toBe('COMPLETED');
    expect(useAuthStore.getState().user?.onboarding_stage).toBe('COMPLETED');
  });
});
