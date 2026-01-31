'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { AuthCard } from '@/features/auth';
import { RoleSelector } from '@/features/auth';
import { StudentRegisterForm } from '@/features/auth';
import { LandlordRegisterForm } from '@/features/auth';
import type { UserRole } from '@/types/auth.types';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import Image from 'next/image';

type RegisterableRole = Extract<UserRole, 'student' | 'landlord'>;

export function RegisterClientPage() {
  const [selectedRole, setSelectedRole] =
    useState<RegisterableRole | null>(null);

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
                />
              </Link>
            }
            title={<span className="font-black text-3xl tracking-tight">Create your Rumi account</span>}
            description={<span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Choose your role to get started</span>}
          >
            <div className="space-y-6">
                <RoleSelector
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                />

              {selectedRole && (
                <div className="pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-top-6 duration-700">
                  {selectedRole === 'student' && <StudentRegisterForm />}
                  {selectedRole === 'landlord' && <LandlordRegisterForm />}
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

