'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { AuthCard } from '@/features/auth/components/auth-card';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { LandlordOnboardingWizard } from '@/features/auth/components/landlord-onboarding-wizard';
import { OnboardingForm } from '@/features/auth/components/onboarding-form';

export default function OnboardingPage() {
  const { user } = useAuth();
  // Until the profile arrives. If the session turns out to be dead, the API
  // client clears it and sends the person to sign in, so this never sticks.
  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

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
