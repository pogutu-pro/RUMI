import type { Metadata } from 'next';

import { SignInFlow } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Start free',
  description: 'Create your RumiaRent account with Google or your email. Free for 30 days, no card needed.',
  alternates: { canonical: '/register' },
};

/**
 * Landlords and agents sign up here. Tenants never do: their landlord adds
 * them, and they sign in with the same email.
 */
export default function RegisterPage() {
  return <SignInFlow intent="sign-up" />;
}
