'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Lock } from 'lucide-react';

import { PasswordField } from '@/components/ui/form-fields';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useResetPassword } from '../hooks/use-auth';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/lib/validations/auth.schema';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

export function ResetPasswordForm({
  onSuccess,
  onError,
  className,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const { mutate: resetPassword, isPending } = useResetPassword();
  const [serverError, setServerError] = useState<string | null>(() =>
    !tokenFromUrl
      ? 'Invalid or missing reset token. Please request a new password reset link.'
      : null,
  );

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isDirty },
    setFocus,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl || '',
      password: '',
      confirm_password: '',
    } as ResetPasswordFormData,
    mode: 'onTouched',
  });

  useEffect(() => {
    setFocus('password');
  }, [setFocus]);

  const onSubmit = (data: ResetPasswordFormData) => {
    setServerError(null);
    resetPassword(data, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err: any) => {
        const msg =
          err?.message || 'Unable to reset password. Please try again.';
        setServerError(msg);
        onError?.(err);
      },
    });
  };

  if (!tokenFromUrl && !serverError) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-5', className)}
      noValidate
    >
      {serverError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-2">
        <Lock className="h-8 w-8 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Reset your password</h2>
        <p className="text-gray-600">
          Enter your new password below to complete the reset process.
        </p>
      </div>

      <div className="space-y-2">
        <PasswordField
          label="New password"
          placeholder="Enter your new password"
          autoComplete="new-password"
          showStrength
          error={errors.password?.message}
          required
          aria-invalid={!!errors.password}
          {...registerField('password')}
        />
      </div>

      <div className="space-y-2">
        <PasswordField
          label="Confirm new password"
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          required
          aria-invalid={!!errors.confirm_password}
          {...registerField('confirm_password')}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={isPending || !isDirty || !tokenFromUrl}
        aria-disabled={isPending || !isDirty || !tokenFromUrl}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Resetting password...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Reset password
          </>
        )}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(AUTH_ROUTES.LOGIN)}
          className="text-sm"
        >
          Back to sign in
        </Button>
      </div>
    </motion.form>
  );
}

ResetPasswordForm.displayName = 'ResetPasswordForm';
