'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoginForm, AuthCard } from '@/features/auth';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams?.get('session_expired') === 'true';
  const verified = searchParams?.get('verified') === 'true';
  const redirectUrl = searchParams?.get('redirect');

  // Save redirect URL to localStorage if provided
  React.useEffect(() => {
    if (redirectUrl) {
      localStorage.setItem('redirectAfterLogin', redirectUrl);
    }
  }, [redirectUrl]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <AuthCard
        icon={
           <Link href="/">
             <Image
               src="/images/logo/logo.svg"
               alt="RumiaRent"
               width={32}
               height={32}
             />
           </Link>
        }
        title={<span className="font-black text-3xl tracking-tight">Welcome to RumiaRent</span>}
        description={<span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Sign in to your account</span>}
      >
        <div className="space-y-4">
          {sessionExpired && (
            <Alert variant="destructive" role="alert" className="rounded-none border-2">
              <AlertCircle className="h-4 w-4" aria-hidden />
              <AlertDescription className="font-bold">
                Your session expired. Please sign in again.
              </AlertDescription>
            </Alert>
          )}

          {verified && (
            <Alert role="status" className="rounded-none border-2 border-primary bg-primary/5">
              <AlertCircle
                className="h-4 w-4 text-primary"
                aria-hidden
              />
              <AlertDescription className="text-primary font-bold">
                Email verified — you can now sign in.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <LoginForm />
      </AuthCard>
    </div>
  );
}
