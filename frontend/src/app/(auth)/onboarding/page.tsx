'use client';

import { Suspense } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { OnboardingForm } from '@/features/auth/components/onboarding-form';
import { AuthCard } from '@/features/auth/components/auth-card';
import { UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50/30 p-4 pt-12">
      <section className="w-full max-w-2xl mx-auto">
        <AuthCard
          icon={
            <div className="w-16 h-16 border-2 border-primary bg-primary/5 flex items-center justify-center rounded-none">
              <UserCheck className="w-8 h-8 text-primary" />
            </div>
          }
          title={<span className="font-black text-3xl tracking-tight uppercase">Complete Profile</span>}
          description={
            <div className="space-y-1">
              <p className="text-gray-900 font-bold">Finish setting up your {user.role} account</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">We need a few more details to verified your identity</p>
            </div>
          }
        >
          <Suspense fallback={<div>Loading form...</div>}>
            <OnboardingForm role={user.role} />
          </Suspense>
        </AuthCard>
      </section>
    </main>
  );
}
