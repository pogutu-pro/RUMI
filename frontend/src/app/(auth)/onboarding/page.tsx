'use client';

import { Suspense } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { AuthCard } from '@/features/auth/components/auth-card';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { LandlordOnboardingWizard } from '@/features/auth/components/landlord-onboarding-wizard';
import { OnboardingForm } from '@/features/auth/components/onboarding-form';

export default function OnboardingPage() {
  const { user } = useAuth();
  if (!user) return null;

  // Landlords get the full-page setup with its own step rail.
  if (user.role === 'landlord') return <LandlordOnboardingWizard />;

  return (
    <AuthShell>
      <AuthCard title="Complete your profile" description={`Finish setting up your ${user.role} account.`}>
        <Suspense fallback={null}>
          <OnboardingForm role={user.role} />
        </Suspense>
      </AuthCard>
    </AuthShell>
  );
}
