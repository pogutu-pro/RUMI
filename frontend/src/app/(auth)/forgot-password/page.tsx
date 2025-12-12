'use client';

import * as React from 'react';
import Link from 'next/link';
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

  const onSubmit = handleSubmit((data) => {
    forgotPassword.mutate(data, {
      onSuccess: () => {
        setEmailSent(data.email);
        setResendSuccess(false);
      },
    });
  });

  const handleResend = () => {
    if (!emailSent) return;
    forgotPassword.mutate(
      { email: emailSent },
      {
        onSuccess: () => setResendSuccess(true),
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
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
              disabled={loading}
              onClick={handleResend}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resending...
                </>
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

          <Button disabled={loading} className="w-full h-11">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending instructions...
              </>
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
