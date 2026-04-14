'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { 
  AuthCard, 
  RoleSelector, 
  StudentRegisterForm, 
  LandlordRegisterForm, 
  CaretakerRegistrationForm,
  GoogleAuthButton,
  GoogleRoleSelection,
  OAuthDivider
} from '@/features/auth';
import type { UserRole } from '@/types/auth.types';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import Image from 'next/image';

type RegisterableRole = Extract<UserRole, 'student' | 'landlord'>;

export function RegisterClientPage() {
  const [selectedRole, setSelectedRole] =
    useState<RegisterableRole | null>(null);
  const [googleData, setGoogleData] = useState<{ userInfo: any; accessToken: string } | null>(null);

  const handleGoogleSuccess = (data: any) => {
    if (data.userInfo) {
      setGoogleData(data);
    }
  };

  if (googleData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50/30 p-4 pt-12">
        <section className="w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <GoogleRoleSelection 
              userInfo={googleData.userInfo} 
              accessToken={googleData.accessToken}
              initialRole={selectedRole}
              onBack={() => setGoogleData(null)} 
            />
          </motion.div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 pt-12">
      <section className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <AuthCard
            icon={
              <Link href="/">
                <Image
                  src="/images/logo/logo.svg"
                  alt="RUMI"
                  width={32}
                  height={32}
                  className="w-8 h-auto"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </Link>
            }
            title={<span className="font-black text-3xl tracking-tight">Create your Rumi account</span>}
            description={<span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Choose your role to get started</span>}
          >
            <div className="space-y-8">
                <RoleSelector
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                />

              {selectedRole && (
                <div className="pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-top-6 duration-700">
                  {selectedRole === 'student' && <StudentRegisterForm onGoogleSuccess={handleGoogleSuccess} />}
                  {selectedRole === 'landlord' && <LandlordRegisterForm onGoogleSuccess={handleGoogleSuccess} />}
                </div>
              )}

              <div className="pt-4 border-t-2 border-primary/10 text-center text-sm font-bold text-gray-500">
                Already have an account?{' '}
                <Link
                  href={AUTH_ROUTES.LOGIN}
                  className="text-primary hover:text-primary/80 transition-colors uppercase tracking-widest text-xs"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </AuthCard>
        </motion.div>
      </section>
    </main>
  );
}

export default RegisterClientPage;

