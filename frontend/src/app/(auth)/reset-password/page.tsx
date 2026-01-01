'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Loader2,
  Lock,
  CheckCircle2,
  XCircle,
  Shield,
  Key,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AuthCard } from '@/features/auth';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/lib/validations/auth.schema';
import { useResetPassword } from '@/features/auth';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export default function ResetPasswordPage() {
  const router = useRouter();
  const navigate = React.useCallback(
    (path: string) => router.push(path as Route),
    [router],
  );

  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const resetMutation = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm_password: '', token },
    mode: 'onTouched',
  });

  const [tokenError, setTokenError] = useState<string | null>(
    !token ? 'Invalid or missing reset token' : null,
  );
  const [success, setSuccess] = useState(false);
  const loading = isSubmitting || resetMutation.isPending;

  const apiError = (resetMutation.error as any) ?? null;

  useEffect(() => {
    if (apiError?.message && !Object.keys(apiError).includes('errors')) {
      setError('password' as any, {
        type: 'server',
        message: apiError.message,
      });
    }
    if (apiError?.errors && typeof apiError.errors === 'object') {
      for (const [field, msgs] of Object.entries(apiError.errors)) {
        const message = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
        try {
          setError(field as any, { type: 'server', message });
        } catch {
          // ignore unknown fields
        }
      }
    }
  }, [apiError, setError]);

  const onSubmit = handleSubmit(async (data) => {
    if (!token) {
      setTokenError('Invalid or missing reset token');
      return;
    }
    const payload = { ...data, token };

    try {
      await resetMutation.mutateAsync(payload);
      setSuccess(true);
      setTimeout(() => navigate(AUTH_ROUTES.LOGIN), 1800);
    } catch (err: any) {
      // error mapping handled in effect above; fallback to console for debugging
      console.error('Reset password error:', err);
    }
  });

  if (tokenError) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <header className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Invalid reset link
            </h1>
            <p className="text-gray-600">
              This password reset link is invalid or has expired.
            </p>
          </header>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Request new reset link
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(AUTH_ROUTES.LOGIN)}
              className="w-full"
            >
              Back to login
            </Button>
          </div>
        </div>
      </motion.section>
    );
  }

  if (success) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <header className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Password reset successful!
            </h1>
            <p className="text-gray-600">
              Your password has been changed successfully.
            </p>
          </header>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 text-center">
              You can now sign in with your new password. Redirecting to
              login...
            </p>
          </div>

          <Button
            onClick={() => navigate(AUTH_ROUTES.LOGIN)}
            className="w-full"
          >
            Go to login
          </Button>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <AuthCard
        title="Reset your password"
        description="Enter a new password for your account"
        icon={<Key className="w-8 h-8 text-gray-600" />}
      >
        <form
          onSubmit={onSubmit}
          className="space-y-5"
          noValidate
          aria-live="polite"
        >
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Choose a strong password that you don&apos;t use for other
              accounts.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              New password
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  id="password"
                  placeholder="Create a strong password"
                  showStrength
                  autoFocus
                  disabled={loading}
                  className={cn(errors.password && 'border-red-500')}
                  {...field}
                />
              )}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm_password"
              className="text-sm font-medium text-gray-700"
            >
              Confirm new password
            </label>
            <Controller
              name="confirm_password"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  id="confirm_password"
                  placeholder="Re-enter your new password"
                  disabled={loading}
                  className={cn(errors.confirm_password && 'border-red-500')}
                  {...field}
                />
              )}
            />
            {errors.confirm_password && (
              <p className="text-sm text-red-600">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Password tips:
            </h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Use a mix of letters, numbers, and symbols</li>
              <li>Avoid common words or personal information</li>
              <li>Consider using a password manager</li>
            </ul>
          </div>

          <div>
            <input type="hidden" name="token" value={token} />
            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
              aria-disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                'Reset password'
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href={AUTH_ROUTES.LOGIN}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </form>
      </AuthCard>
    </motion.section>
  );
}
