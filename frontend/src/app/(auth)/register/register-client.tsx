'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { AuthCard } from '@/components/auth/auth-card';
import { RoleSelector } from '@/components/auth/role-selector';
import { StudentRegisterForm } from '@/components/auth/student-register-form';
import { LandlordRegisterForm } from '@/components/auth/landlord-register-form';
import type { UserRole } from '@/types/auth.types';
import { AUTH_ROUTES } from '@/lib/constants/routes';

type RegisterableRole = Extract<UserRole, 'student' | 'landlord'>;

export function RegisterClientPage() {
  const [selectedRole, setSelectedRole] =
    useState<RegisterableRole>('student');

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <AuthCard
            title="Create your account"
            description="Join thousands of students and landlords on RUMI"
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  I am a...
                </label>
                <RoleSelector
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                />
              </div>

              {selectedRole === 'student' && <StudentRegisterForm />}
              {selectedRole === 'landlord' && <LandlordRegisterForm />}

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

