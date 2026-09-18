'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/validations/auth.schema';
import { useForgotPassword } from '@/features/auth';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = React.useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  // Seconds left before another request can be sent. Previously there was
  // no cooldown at all: once the mutation resolved (usually well under a
  // second), the button was immediately clickable again, so a user could
  // just keep clicking "Resend" and queue an unbounded number of emails.
  // The backend now enforces this too (accounts/views.py
  // PasswordResetRequestView), so this is UI feedback for a real limit,
  // not just a client-side nicety.
  const [cooldown, setCooldown] = React.useState(0);
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const loading = forgotPassword.isPending || isSubmitting;
  const hasError = Boolean(forgotPassword.error);
  const canSubmit = !loading && cooldown === 0;

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // A successful request always starts the cooldown (the backend sends
  // retry_after_seconds on every 200; 60s is just a defensive fallback).
  const startCooldown = (seconds: number | undefined) => {
    setCooldown(typeof seconds === 'number' && seconds > 0 ? seconds : 60);
  };

  // An error only starts a cooldown when it's actually the 429 rate-limit
  // response carrying one — a genuine failure (network blip, 500) must NOT
  // block the user from retrying immediately.
  const startCooldownFromError = (error: unknown) => {
    const retryAfter = (
      error as { response?: { data?: { retry_after_seconds?: number } } }
    )?.response?.data?.retry_after_seconds;
    if (typeof retryAfter === 'number' && retryAfter > 0) {
      setCooldown(retryAfter);
    }
  };

  const onSubmit = handleSubmit((data) => {
    if (!canSubmit) return;
    forgotPassword.mutate(data, {
      onSuccess: (response) => {
        setEmailSent(data.email);
        setResendSuccess(false);
        startCooldown(response.retry_after_seconds);
      },
      onError: startCooldownFromError,
    });
  });

  const handleResend = () => {
    if (!emailSent || !canSubmit) return;
    forgotPassword.mutate(
      { email: emailSent },
      {
        onSuccess: (response) => {
          setResendSuccess(true);
          startCooldown(response.retry_after_seconds);
        },
        onError: startCooldownFromError,
      },
    );
  };

  if (emailSent) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Link href="/" className="mb-6 flex justify-center">
          <Image src="/images/logo/logo.png" alt="RumiaRent" width={40} height={40} />
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
          </div>

          <header className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Check your inbox
            </h1>
            <p className="text-gray-600">Password reset link sent to</p>
            <p className="font-medium text-gray-900">{emailSent}</p>
          </header>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <h3 className="font-medium text-blue-900">Next steps</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Check your email (and spam folder)</li>
              <li>Open the reset link</li>
              <li>Create your new password</li>
              <li>Log back in securely</li>
            </ol>
          </div>

          <div className="space-y-4">
            {resendSuccess && (
              <p className="text-center text-sm text-green-600">
                Reset link resent successfully
              </p>
            )}

            <Button
              variant="outline"
              className="w-full"
              disabled={!canSubmit}
              onClick={handleResend}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resending...
                </>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                'Resend reset link'
              )}
            </Button>
          </div>

          <div className="pt-4 border-t text-center">
            <Link
              href={AUTH_ROUTES.LOGIN}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Link expires in 1 hour • Secure & encrypted
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Link href="/" className="mb-6 flex justify-center">
        <Image src="/images/logo/logo.png" alt="RumiaRent" width={40} height={40} />
      </Link>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 space-y-6">
        <header className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Forgot your password?
          </h1>
          <p className="text-gray-600">
            Enter your email to receive reset instructions.
          </p>
        </header>

        {hasError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to send reset link. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={loading}
                className={cn(
                  'pl-10 transition-all',
                  errors.email && 'border-red-500 focus-visible:ring-red-500',
                )}
                {...register('email')}
              />
            </div>

            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <Button disabled={!canSubmit} className="w-full h-11">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending instructions...
              </>
            ) : cooldown > 0 ? (
              `Try again in ${cooldown}s`
            ) : (
              'Send reset instructions'
            )}
          </Button>
        </form>

        <div className="pt-4 border-t text-center">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        Secure, encrypted, and time-limited reset process
      </p>
    </motion.section>
  );
}
