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
            title="Create your account"
            description="Choose your role to get started"
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

              <div className="pt-4 border-t text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href={AUTH_ROUTES.LOGIN}
                  className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
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

