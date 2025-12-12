'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Mail, ArrowLeft } from 'lucide-react';

import { FormField } from '@/components/ui/form-fields';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForgotPassword } from '../hooks/use-auth';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/validations/auth.schema';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
  onError?: (error: any) => void;
  className?: string;
  showLoginLink?: boolean;
}

export function ForgotPasswordForm({
  onSuccess,
  onError,
  className,
  showLoginLink = true,
}: ForgotPasswordFormProps) {
  const {
    mutate: forgotPassword,
    isPending,
    isSuccess,
    error,
  } = useForgotPassword();
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setFocus,
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  React.useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data, {
      onSuccess: () => {
        setEmailSent(data.email);
        onSuccess?.(data.email);
        reset();
      },
      onError: (err: any) => {
        onError?.(err);
      },
    });
  };

  const handleResend = () => {
    if (!emailSent) return;
    forgotPassword(
      { email: emailSent },
      {
        onSuccess: () => {
          onSuccess?.(emailSent);
        },
        onError: (err: any) => {
          onError?.(err);
        },
      },
    );
  };

  if (emailSent && isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 py-4"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-green-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            Check your inbox
          </h3>
          <p className="text-gray-600">
            Password reset link sent to{' '}
            <span className="font-medium text-gray-900">{emailSent}</span>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-blue-900">Next steps</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Check your email (and spam folder)</li>
            <li>Open the reset link</li>
            <li>Create your new password</li>
            <li>Log back in securely</li>
          </ol>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={handleResend}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              'Resend reset link'
            )}
          </Button>

          {showLoginLink && (
            <Link href={AUTH_ROUTES.LOGIN}>
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Link expires in 1 hour • Secure & encrypted
        </p>
      </motion.div>
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
      {error != null && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>
            Failed to send reset link. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-2 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Forgot your password?
        </h3>
        <p className="text-sm text-gray-600">
          Enter your email to receive reset instructions.
        </p>
      </div>

      <FormField
        label="Email address"
        type="email"
        placeholder="you@university.edu"
        autoComplete="email"
        error={errors.email?.message}
        required
        aria-invalid={!!errors.email}
        {...register('email')}
      />

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={isPending || !isDirty}
        aria-disabled={isPending || !isDirty}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Sending instructions...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Send reset instructions
          </>
        )}
      </Button>

      {showLoginLink && (
        <div className="text-center pt-4 border-t">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      )}
    </motion.form>
  );
}

ForgotPasswordForm.displayName = 'ForgotPasswordForm';
