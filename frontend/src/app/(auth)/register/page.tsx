'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { RegisterFormNew } from '@/features/auth';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect');
  const prefillEmail = searchParams?.get('email') || '';

  // Save redirect URL to localStorage if provided
  React.useEffect(() => {
    if (redirectUrl) {
      localStorage.setItem('redirectAfterLogin', redirectUrl);
    }
  }, [redirectUrl]);

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-center">
          <h1 className="text-base font-bold text-gray-900">
            Log in or sign up
          </h1>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Rumi</h2>
          </div>
          <RegisterFormNew prefillEmail={prefillEmail} />
        </div>
      </div>
    </div>
  );
}
