'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OTPInput } from '@/components/ui/otp-input';
import { useVerifyEmail, useResendVerification } from '../hooks/use-auth';
import {
  verifyEmailSchema,
  type VerifyEmailFormData,
} from '@/lib/validations/auth.schema';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface VerifyEmailFormProps {
  email?: string;
  token?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
  showLoginLink?: boolean;
}

export function VerifyEmailForm({
  email,
  token,
  onSuccess,
  onError,
  className,
  showLoginLink = true,
}: VerifyEmailFormProps) {
  const { mutate: verifyEmail, isPending, isSuccess, error } = useVerifyEmail();
  const { mutate: resendVerification, isPending: resendPending } =
    useResendVerification();

  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: '', email: email || '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setInterval(
      () => setResendCooldown((prev) => Math.max(0, prev - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  const onSubmit = (data: VerifyEmailFormData) => {
    verifyEmail(data as any, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err: any) => {
        const msg = err?.message ?? 'Invalid verification code';
        setError('otp', { message: msg });
        onError?.(err);
      },
    });
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendPending) return;
    try {
      const payload = token ? { token } : { email: email || '' };
      resendVerification(payload as any, {
        onSuccess: () => {
          setResendCooldown(60);
          clearErrors('otp');
          setValue('otp', '');
        },
        onError: (err: any) => {
          const msg = err?.message ?? 'Unable to resend code';
          setError('otp', { message: msg });
          onError?.(err);
        },
      });
    } catch (err: any) {
      const msg = err?.message ?? 'Unable to resend code';
      setError('otp', { message: msg });
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 py-4"
      >
        <div className="w-16 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            Email verified!
          </h3>
          <p className="text-gray-600">
            Your email has been verified. Redirecting to your dashboard…
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-green-600 h-full rounded-full transition-all duration-1500 ease-in-out w-full" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-6', className)}
      noValidate
    >
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Verification code sent to <strong>{email || 'your email'}</strong>
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 text-center">
          Enter verification code
        </label>

        <Controller
          control={control}
          name="otp"
          render={({ field }) => (
            <OTPInput
              length={6}
              value={field.value}
              onChange={(value: string) => {
                field.onChange(value);
                if (errors.otp) clearErrors('otp');
              }}
              disabled={isPending}
              error={!!errors.otp}
            />
          )}
        />

        {errors.otp && (
          <p className="text-sm text-red-600 text-center">
            {errors.otp.message}
          </p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800">
          The code will expire in{' '}
          <span className="font-semibold">10 minutes</span>
        </p>
      </div>

      <Button
        type="submit"
        className="w-full h-11"
        disabled={isPending}
        aria-disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify email'
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Didn&apos;t receive the code?</p>
        <Button
          type="button"
          variant="ghost"
          onClick={handleResend}
          disabled={isPending || resendCooldown > 0 || resendPending}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </Button>
      </div>

      {showLoginLink && (
        <div className="pt-4 border-t text-center">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to login
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-500">
        Your verification code is secure and one-time use
      </p>
    </motion.form>
  );
}

VerifyEmailForm.displayName = 'VerifyEmailForm';
