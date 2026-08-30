'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { AuthCard, LandlordRegisterForm } from '@/features/auth';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import Image from 'next/image';

/**
 * Only organisations (landlords / agents) register here. Tenants never
 * self-register — they're invited by their landlord or caretaker once
 * added to a property, and set their password from that invite email.
 */
export function RegisterClientPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 pt-12">
      <section className="w-full max-w-2xl mx-auto">
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
                  alt="RumiaRent"
                  width={32}
                  height={32}
                  className="w-8 h-auto"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </Link>
            }
            title={<span className="font-black text-3xl tracking-tight">Create your RumiaRent account</span>}
            description={<span className="text-gray-500 font-bold uppercase tracking-wider text-xs">For landlords and agents. Your tenants will be added by you, not through sign up.</span>}
          >
            <div className="space-y-8">
              <LandlordRegisterForm />

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
