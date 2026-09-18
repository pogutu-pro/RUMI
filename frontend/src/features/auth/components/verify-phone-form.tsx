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
  Smartphone,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OTPInput } from '@/components/ui/otp-input';
import { useVerifyPhone, useResendVerification } from '../hooks/use-auth';
import {
  verifyPhoneSchema,
  type VerifyPhoneFormData,
} from '@/lib/validations/auth.schema';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface VerifyPhoneFormProps {
  phone?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
  showLoginLink?: boolean;
}

export function VerifyPhoneForm({
  phone,
  onSuccess,
  onError,
  className,
  showLoginLink = true,
}: VerifyPhoneFormProps) {
  const { mutate: verifyPhone, isPending, isSuccess, error } = useVerifyPhone();
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
  } = useForm<VerifyPhoneFormData>({
    resolver: zodResolver(verifyPhoneSchema),
    defaultValues: { otp: '', phone: phone || '' },
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

  const onSubmit = (data: VerifyPhoneFormData) => {
    verifyPhone(data as any, {
      onSuccess: () => {
        onSuccess?.();
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1800);
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
      const payload = { phone: phone || '' };
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

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\+254|0)(\d{2})(\d{4})(\d{4})/, '$1$2****$4');
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 py-4"
      >
        <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            Phone verified
          </h3>
          <p className="text-gray-600">
            You&apos;re all set — redirecting to your dashboard.
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-600 h-full rounded-full"
            style={{
              width: '100%',
              animation: 'progress 1.8s ease-in-out forwards',
            }}
          />
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes progress {
                from { width: 0%; }
                to { width: 100%; }
              }
            `,
          }}
        />
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
        <Smartphone className="h-4 w-4" />
        <AlertDescription className="text-sm">
          SMS verification code sent to{' '}
          <strong>{maskPhone(phone || '')}</strong>
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

      <div className="bg-muted/50 border border-border rounded-xl p-4 text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Expires in <span className="font-semibold">5 minutes</span>
        </p>
        <p className="text-xs text-muted-foreground">Standard SMS rates may apply</p>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={isPending}
        aria-disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify phone number'
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Didn&apos;t receive the code?</p>
        <Button
          type="button"
          variant="ghost"
          onClick={handleResend}
          disabled={isPending || resendCooldown > 0 || resendPending}
          className="text-primary hover:text-primary/80 hover:bg-primary/5"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : 'Resend SMS code'}
        </Button>
      </div>

      {showLoginLink && (
        <div className="pt-4 border-t text-center">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Use a different phone number
          </Link>
        </div>
      )}
    </motion.form>
  );
}

VerifyPhoneForm.displayName = 'VerifyPhoneForm';
